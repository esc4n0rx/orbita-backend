// neurolink/models/notificationModel.js
const supabase = require('../../config/database');

class NotificationModel {
  static TABELA = 'orbita_notifications';
  static TABELA_SETTINGS = 'orbita_notification_settings';
  static TABELA_FEEDBACK = 'orbita_notification_feedback';
  static TABELA_CONTEXT = 'orbita_user_context';

  /**
   * Cria uma nova notificação
   * @param {Object} notification - Dados da notificação
   * @returns {Promise<Object>} - Notificação criada
   */
  static async criarNotificacao(notification) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .insert([{
        usuario_id: notification.usuario_id,
        tarefa_id: notification.tarefa_id,
        tipo: notification.tipo,
        titulo: notification.titulo,
        mensagem: notification.mensagem,
        prioridade: notification.prioridade || 5,
        agendado_para: notification.agendado_para,
        status: notification.status || 'PENDING',
        metadata: notification.metadata || {}
      }])
      .select('*');

    if (error) {
      console.error('Erro ao criar notificação:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Lista notificações pendentes para envio
   * @param {number} limit - Limite de notificações
   * @returns {Promise<Array>} - Lista de notificações
   */
  static async listarPendentesParaEnvio(limit = 50) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select(`
        *,
        usuario:usuario_id (
          id, nome, email, nivel, sequencia
        ),
        tarefa:tarefa_id (
          id, nome, descricao, pontos, data_vencimento
        )
      `)
      .eq('status', 'PENDING')
      .lte('agendado_para', new Date().toISOString())
      .order('prioridade', { ascending: false })
      .order('agendado_para', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao listar notificações pendentes para envio:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Lista notificações pendentes para envio (método original mantido para compatibilidade)
   * @param {number} limit - Limite de notificações
   * @returns {Promise<Array>} - Lista de notificações
   */
  static async listarPendentes(limit = 50) {
    return this.listarPendentesParaEnvio(limit);
  }

  /**
   * Lista notificações do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {Object} filtros - Filtros opcionais
   * @returns {Promise<Array>} - Lista de notificações
   */
  static async listarPorUsuario(usuarioId, filtros = {}) {
    let query = supabase
      .from(this.TABELA)
      .select('*')
      .eq('usuario_id', usuarioId);

    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite);
    }

    query = query.order('criado_em', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar notificações do usuário:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Lista notificações recentes por usuário e tipo
   * @param {string} usuarioId - ID do usuário
   * @param {string} tipo - Tipo da notificação
   * @param {string} dataMinima - Data mínima em ISO string
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} - Lista de notificações
   */
  static async listarRecentesPorUsuarioETipo(usuarioId, tipo, dataMinima, limit = 10) {
    const { data, error } = await supabase
      .from(this.TABELA)
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('tipo', tipo)
      .gte('criado_em', dataMinima)
      .order('criado_em', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao listar notificações recentes:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Atualiza status da notificação
   * @param {string} id - ID da notificação
   * @param {string} status - Novo status
   * @param {Object} extras - Campos extras para atualizar
   * @returns {Promise<Object>} - Notificação atualizada
   */
  static async atualizarStatus(id, status, extras = {}) {
    const updates = { status };
    
    // Adicionar timestamps baseados no status
    if (status === 'SENT') {
      updates.enviado_em = new Date().toISOString();
    } else if (status === 'read') {
      updates.lido_em = new Date().toISOString();
    }

    // Processar campos extras de forma segura
    Object.keys(extras).forEach(key => {
      // Verificar se é um campo válido antes de adicionar
      if (this._isValidUpdateField(key)) {
        updates[key] = extras[key];
      } else {
        console.warn(`Campo ignorado na atualização: ${key}`);
      }
    });

    const { data, error } = await supabase
      .from(this.TABELA)
      .update(updates)
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Erro ao atualizar status da notificação:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Verifica se um campo é válido para atualização
   * @param {string} fieldName - Nome do campo
   * @returns {boolean} - Se o campo é válido
   */
  static _isValidUpdateField(fieldName) {
    const validFields = [
      'status',
      'enviado_em',
      'lido_em',
      'metadata',
      'agendado_para',
      'push_service_response'
    ];
    
    return validFields.includes(fieldName);
  }

  /**
   * Busca configurações de notificação do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Configurações do usuário
   */
  static async buscarConfiguracoes(usuarioId) {
    const { data, error } = await supabase
      .from(this.TABELA_SETTINGS)
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Usuário não tem configurações, criar padrão
        return await this.criarConfiguracoesPadrao(usuarioId);
      }
      console.error('Erro ao buscar configurações:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Cria configurações padrão para o usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Configurações criadas
   */
  static async criarConfiguracoesPadrao(usuarioId) {
    const { data, error } = await supabase
      .from(this.TABELA_SETTINGS)
      .insert([{
        usuario_id: usuarioId,
        personalidade: 'casual',
        horario_inicio: '07:00',
        horario_fim: '22:00',
        frequencia_maxima: 5,
        tipos_habilitados: ['ALERT', 'REMINDER', 'MOTIVATION'],
        timezone: 'America/Sao_Paulo'
      }])
      .select('*');

    if (error) {
      console.error('Erro ao criar configurações padrão:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Atualiza configurações do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {Object} configuracoes - Novas configurações
   * @returns {Promise<Object>} - Configurações atualizadas
   */
  static async atualizarConfiguracoes(usuarioId, configuracoes) {
    const { data, error } = await supabase
      .from(this.TABELA_SETTINGS)
      .update(configuracoes)
      .eq('usuario_id', usuarioId)
      .select('*');

    if (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Salva feedback da notificação
   * @param {Object} feedback - Dados do feedback
   * @returns {Promise<Object>} - Feedback salvo
   */
  static async salvarFeedback(feedback) {
    const { data, error } = await supabase
      .from(this.TABELA_FEEDBACK)
      .insert([{
        notification_id: feedback.notification_id,
        usuario_id: feedback.usuario_id,
        feedback_tipo: feedback.feedback_tipo,
        comentario: feedback.comentario
      }])
      .select('*');

    if (error) {
      console.error('Erro ao salvar feedback:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Busca contexto do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Contexto do usuário
   */
  static async buscarContextoUsuario(usuarioId) {
    const { data, error } = await supabase
      .from(this.TABELA_CONTEXT)
      .select('*')
      .eq('usuario_id', usuarioId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Criar contexto inicial
        return await this.criarContextoInicial(usuarioId);
      }
      console.error('Erro ao buscar contexto do usuário:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Cria contexto inicial do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Contexto criado
   */
  static async criarContextoInicial(usuarioId) {
    const { data, error } = await supabase
      .from(this.TABELA_CONTEXT)
      .insert([{
        usuario_id: usuarioId,
        padroes_atividade: {},
        preferencias_tom: {},
        historico_engajamento: {},
        ultima_atividade: new Date().toISOString()
      }])
      .select('*');

    if (error) {
      console.error('Erro ao criar contexto inicial:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Atualiza contexto do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {Object} novoContexto - Novo contexto
   * @returns {Promise<Object>} - Contexto atualizado
   */
  static async atualizarContexto(usuarioId, novoContexto) {
    const { data, error } = await supabase
      .from(this.TABELA_CONTEXT)
      .update({
        ...novoContexto,
        ultima_atividade: new Date().toISOString()
      })
      .eq('usuario_id', usuarioId)
      .select('*');

    if (error) {
      console.error('Erro ao atualizar contexto:', error);
      throw new Error(error.message);
    }

    return data[0];
  }

  /**
   * Conta notificações enviadas hoje para o usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<number>} - Quantidade de notificações
   */
  static async contarNotificacoesHoje(usuarioId) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const { count, error } = await supabase
      .from(this.TABELA)
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('status', 'SENT')
      .gte('enviado_em', hoje.toISOString())
      .lt('enviado_em', amanha.toISOString());

    if (error) {
      console.error('Erro ao contar notificações de hoje:', error);
      return 0;
    }

    return count;
  }

  /**
   * Remove notificações antigas
   * @param {number} diasAntigos - Número de dias para considerar antigo
   * @returns {Promise<number>} - Quantidade removida
   */
  static async limparNotificacoesAntigas(diasAntigos = 30) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAntigos);

    const { error } = await supabase
      .from(this.TABELA)
      .delete()
      .lt('criado_em', dataLimite.toISOString())
      .in('status', ['SENT', 'read', 'DISMISSED']);

    if (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      throw new Error(error.message);
    }

    return true;
  }
}

module.exports = NotificationModel;