// neurolink/push/WebPushConfig.js
const webpush = require('web-push');
require('dotenv').config();

class WebPushConfig {
  constructor() {
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Inicializa configuração do Web Push
   */
  initialize() {
    try {
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = process.env.VAPID_SUBJECT;

      if (!publicKey || !privateKey || !subject) {
        console.warn('⚠️ Chaves VAPID não configuradas. Push notifications desabilitadas.');
        console.warn('Execute: node scripts/generateVapidKeys.js para gerar as chaves');
        return;
      }

      // Configurar VAPID
      webpush.setVapidDetails(subject, publicKey, privateKey);
      
      this.isConfigured = true;
      console.log('✅ Web Push configurado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao configurar Web Push:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verifica se Web Push está configurado
   * @returns {boolean} - Status da configuração
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Obtém chave pública VAPID
   * @returns {string} - Chave pública
   */
  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
  }

  /**
   * Envia notificação push
   * @param {Object} subscription - Subscription do usuário
   * @param {Object} payload - Dados da notificação
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resultado do envio
   */
  async sendNotification(subscription, payload, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Web Push não está configurado');
    }

    try {
      const defaultOptions = {
        TTL: 24 * 60 * 60, // 24 horas
        urgency: 'normal',
        ...options
      };

      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload),
        defaultOptions
      );

      return {
        success: true,
        statusCode: result.statusCode,
        headers: result.headers
      };

    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
      
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
        endpoint: subscription.endpoint
      };
    }
  }

  /**
   * Envia notificação para múltiplas subscriptions
   * @param {Array} subscriptions - Lista de subscriptions
   * @param {Object} payload - Dados da notificação
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resultado dos envios
   */
  async sendToMultiple(subscriptions, payload, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Web Push não está configurado');
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    const promises = subscriptions.map(async (subscription) => {
      try {
        const result = await this.sendNotification(subscription, payload, options);
        
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            endpoint: subscription.endpoint,
            error: result.error
          });
        }
        
        return result;
      } catch (error) {
        results.failed++;
        results.errors.push({
          endpoint: subscription.endpoint,
          error: error.message
        });
        return { success: false, error: error.message };
      }
    });

    await Promise.all(promises);
    
    return results;
  }

  /**
   * Valida subscription
   * @param {Object} subscription - Subscription a ser validada
   * @returns {boolean} - Se é válida
   */
  validateSubscription(subscription) {
    return !!(
      subscription &&
      subscription.endpoint &&
      subscription.keys &&
      subscription.keys.p256dh &&
      subscription.keys.auth
    );
  }
}

module.exports = WebPushConfig;