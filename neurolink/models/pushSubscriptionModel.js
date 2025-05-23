// neurolink/models/pushSubscriptionModel.js
const supabase = require('../../config/database');

class PushSubscriptionModel {
  static TABELA = 'orbita_push_subscriptions';

  /**
   * Salva subscription do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {Object} subscription - Dados da subscription
   * @param {Object} metadata - Metadados adicionais
   * @returns {Promise<Object>} - Subscription salva
   */
  static async salvarSubscription(usuarioId, subscription, metadata = {}) {
    // Verificar se já existe uma subscription para este endpoint
    const { data: existing } = await supabase
      .from(this.TABELA)
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      // Atualizar subscription existente
      const { data, error } = await supabase
        .from(this.TABELA)
        .update({
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          metadata: {
            ...metadata,
            updated_at: new Date().toISOString()
          },
          ativo: true
        })
        .eq('id', existing.id)
        .select('*');

      if (error) {
        console.error('Erro ao atualizar subscription:', error);
        throw new Error(error.message);
      }

      return data[0];
    }

    // Criar nova subscription
    const { data, error } = await supabase
      .from(this.TABELA)
      .insert([{
        usuario_id: usuarioId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        metadata: {
          ...metadata,
          created_at: new Date().toISOString()
        },
        ativo: true
      }])
      .select('*');

    if (error) {
      console.error('Erro ao salvar subscription:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Busca subscriptions ativas do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Array>} - Lista de subscriptions
   */
  static async buscarSubscriptionsUsuario(usuarioId) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ativo', true)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar subscriptions:', error);
      throw new Error(error.message);
    }

    // Converter para formato web-push
    return data.map(sub => ({
      id: sub.id,
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh_key,
        auth: sub.auth_key
      },
      metadata: sub.metadata
    }));
  }

  /**
   * Remove subscription do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {string} endpoint - Endpoint da subscription
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  static async removerSubscription(usuarioId, endpoint) {
    const { error } = await supabase
      .from(this.TABELA)
      .update({ ativo: false })
      .eq('usuario_id', usuarioId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Erro ao remover subscription:', error);
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Busca todas as subscriptions ativas (para broadcast)
   * @param {Array} usuarioIds - IDs dos usuários (opcional)
   * @returns {Promise<Array>} - Lista de subscriptions
   */
  static async buscarSubscriptionsAtivas(usuarioIds = null) {
    let query = supabase
      .from(this.TABELA)
      .select(`
        *,
        usuario:usuario_id (id, nome, email)
      `)
      .eq('ativo', true);

    if (usuarioIds && usuarioIds.length > 0) {
      query = query.in('usuario_id', usuarioIds);
    }

    const { data, error } = await query.order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar subscriptions ativas:', error);
      throw new Error(error.message);
    }

    return data.map(sub => ({
      id: sub.id,
      usuario_id: sub.usuario_id,
      usuario: sub.usuario,
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh_key,
        auth: sub.auth_key
      },
      metadata: sub.metadata
    }));
  }

  /**
   * Marca subscription como inválida
   * @param {string} endpoint - Endpoint da subscription
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  static async marcarComoInvalida(endpoint) {
    const { error } = await supabase
      .from(this.TABELA)
      .update({ 
        ativo: false,
        metadata: {
          invalidated_at: new Date().toISOString(),
          reason: 'invalid_endpoint'
        }
      })
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Erro ao marcar subscription como inválida:', error);
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Limpa subscriptions antigas e inativas
   * @param {number} diasAntigos - Dias para considerar antigo
   * @returns {Promise<number>} - Quantidade removida
   */
  static async limparSubscriptionsAntigas(diasAntigos = 90) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAntigos);

    const { error } = await supabase
      .from(this.TABELA)
      .delete()
      .eq('ativo', false)
      .lt('criado_em', dataLimite.toISOString());

    if (error) {
      console.error('Erro ao limpar subscriptions antigas:', error);
      throw new Error(error.message);
    }

    return true;
  }
}

module.exports = PushSubscriptionModel;