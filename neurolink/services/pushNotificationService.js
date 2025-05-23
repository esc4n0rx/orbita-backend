// neurolink/services/pushNotificationService.js
const WebPushConfig = require('../push/WebPushConfig');
const PushSubscriptionModel = require('../models/pushSubscriptionModel');

class PushNotificationService {
  constructor() {
    this.webPush = new WebPushConfig();
  }

  /**
   * Registra subscription do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {Object} subscription - Dados da subscription
   * @param {Object} deviceInfo - Informações do dispositivo
   * @returns {Promise<Object>} - Resultado do registro
   */
  async registrarSubscription(usuarioId, subscription, deviceInfo = {}) {
    try {
      // Validar subscription
      if (!this.webPush.validateSubscription(subscription)) {
        throw new Error('Subscription inválida');
      }

      // Salvar no banco
      const savedSubscription = await PushSubscriptionModel.salvarSubscription(
        usuarioId,
        subscription,
        {
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          registered_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        subscription_id: savedSubscription.id,
        message: 'Push notifications ativadas com sucesso'
      };

    } catch (error) {
      console.error('Erro ao registrar subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove subscription do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {string} endpoint - Endpoint da subscription
   * @returns {Promise<Object>} - Resultado da remoção
   */
  async removerSubscription(usuarioId, endpoint) {
    try {
      await PushSubscriptionModel.removerSubscription(usuarioId, endpoint);
      
      return {
        success: true,
        message: 'Push notifications desativadas'
      };

    } catch (error) {
      console.error('Erro ao remover subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia push notification para usuário específico
   * @param {string} usuarioId - ID do usuário
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<Object>} - Resultado do envio
   */
  async enviarParaUsuario(usuarioId, notificationData) {
    try {
      if (!this.webPush.isReady()) {
        console.warn('Web Push não configurado, pulando envio');
        return { success: false, error: 'Web Push não configurado' };
      }

      // Buscar subscriptions do usuário
      const subscriptions = await PushSubscriptionModel.buscarSubscriptionsUsuario(usuarioId);
      
      if (subscriptions.length === 0) {
        return { 
          success: false, 
          error: 'Usuário não possui subscriptions ativas' 
        };
      }

      // Preparar payload
      const payload = this._prepararPayload(notificationData);
      
      // Enviar para todas as subscriptions do usuário
      const results = await this.webPush.sendToMultiple(subscriptions, payload);
      
      // Processar subscriptions inválidas
      await this._processarSubscriptionsInvalidas(results.errors);

      return {
        success: true,
        sent_count: results.successful,
        failed_count: results.failed,
        total_subscriptions: subscriptions.length
      };

    } catch (error) {
      console.error('Erro ao enviar push para usuário:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia push notification para múltiplos usuários
   * @param {Array} usuarioIds - IDs dos usuários
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<Object>} - Resultado dos envios
   */
  async enviarParaMultiplosUsuarios(usuarioIds, notificationData) {
    try {
      if (!this.webPush.isReady()) {
        console.warn('Web Push não configurado, pulando envio');
        return { success: false, error: 'Web Push não configurado' };
      }

      // Buscar todas as subscriptions dos usuários
      const subscriptions = await PushSubscriptionModel.buscarSubscriptionsAtivas(usuarioIds);
      
      if (subscriptions.length === 0) {
        return { 
          success: false, 
          error: 'Nenhuma subscription ativa encontrada' 
        };
      }

      // Preparar payload
      const payload = this._prepararPayload(notificationData);
      
      // Enviar para todas as subscriptions
      const webPushSubscriptions = subscriptions.map(sub => ({
        endpoint: sub.endpoint,
        keys: sub.keys
      }));

      const results = await this.webPush.sendToMultiple(webPushSubscriptions, payload);
      
      // Processar subscriptions inválidas
      await this._processarSubscriptionsInvalidas(results.errors);

      return {
        success: true,
        sent_count: results.successful,
        failed_count: results.failed,
        total_subscriptions: subscriptions.length,
        users_targeted: usuarioIds.length
      };

    } catch (error) {
      console.error('Erro ao enviar push para múltiplos usuários:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém chave pública VAPID
   * @returns {string} - Chave pública
   */
  obterChavePublica() {
    return this.webPush.getPublicKey();
  }

  /**
   * Verifica se push notifications estão configuradas
   * @returns {boolean} - Status da configuração
   */
  estaConfigurado() {
    return this.webPush.isReady();
  }

  /**
   * Prepara payload da notificação
   * @param {Object} notificationData - Dados da notificação
   * @returns {Object} - Payload formatado
   */
  _prepararPayload(notificationData) {
    return {
      title: notificationData.titulo || 'NeuroLink',
      body: notificationData.mensagem || 'Nova notificação',
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      data: {
        id: notificationData.id,
        tipo: notificationData.tipo,
        tarefa_id: notificationData.tarefa_id,
        url: notificationData.url || '/dashboard',
        timestamp: new Date().toISOString()
      },
      requireInteraction: notificationData.prioridade >= 8,
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dispensar',
          icon: '/icons/dismiss-icon.png'
        }
      ]
    };
  }

  /**
   * Processa subscriptions que falharam
   * @param {Array} errors - Lista de erros
   */
  async _processarSubscriptionsInvalidas(errors) {
    for (const error of errors) {
      // Se o erro indica subscription inválida, marcar como inativa
      if (error.error && (
        error.error.includes('410') || 
        error.error.includes('invalid') ||
        error.error.includes('expired')
      )) {
        try {
          await PushSubscriptionModel.marcarComoInvalida(error.endpoint);
          console.log(`Subscription inválida removida: ${error.endpoint}`);
        } catch (e) {
          console.error('Erro ao marcar subscription como inválida:', e);
        }
      }
    }
  }
}

module.exports = PushNotificationService;