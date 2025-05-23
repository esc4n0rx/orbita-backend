// controllers/pushNotificationController.js
const PushNotificationService = require('../neurolink/services/pushNotificationService');
const { z } = require('zod');

// Validadores
const subscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint deve ser uma URL válida'),
  keys: z.object({
    p256dh: z.string().min(1, 'Chave p256dh é obrigatória'),
    auth: z.string().min(1, 'Chave auth é obrigatória')
  })
});

const deviceInfoSchema = z.object({
  userAgent: z.string().optional(),
  platform: z.string().optional()
}).optional();

class PushNotificationController {
  constructor() {
    this.pushService = new PushNotificationService();
  }

  /**
   * Obtém chave pública VAPID
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async obterChavePublica(req, res) {
    try {
      if (!this.pushService.estaConfigurado()) {
        return res.status(503).json({
          erro: true,
          mensagem: 'Push notifications não estão configuradas no servidor'
        });
      }

      const publicKey = this.pushService.obterChavePublica();

      return res.status(200).json({
        erro: false,
        public_key: publicKey,
        configurado: true
      });
    } catch (error) {
      console.error('Erro ao obter chave pública:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Registra subscription do usuário
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async registrarSubscription(req, res) {
    try {
      // Validar dados de entrada
      const subscriptionResult = subscriptionSchema.safeParse(req.body.subscription);
      if (!subscriptionResult.success) {
        return res.status(400).json({
          erro: true,
          mensagem: 'Dados de subscription inválidos',
          detalhes: subscriptionResult.error.issues
        });
      }

      const deviceInfoResult = deviceInfoSchema.safeParse(req.body.deviceInfo);
      const deviceInfo = deviceInfoResult.success ? deviceInfoResult.data : {};

      const usuarioId = req.usuario.id;
      const subscription = subscriptionResult.data;

      // Registrar subscription
      const result = await this.pushService.registrarSubscription(
        usuarioId,
        subscription,
        deviceInfo
      );

      if (!result.success) {
        return res.status(400).json({
          erro: true,
          mensagem: result.error
        });
      }

      return res.status(201).json({
        erro: false,
        mensagem: result.message,
        subscription_id: result.subscription_id
      });
    } catch (error) {
      console.error('Erro ao registrar subscription:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remove subscription do usuário
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async removerSubscription(req, res) {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          erro: true,
          mensagem: 'Endpoint é obrigatório'
        });
      }

      const usuarioId = req.usuario.id;

      const result = await this.pushService.removerSubscription(usuarioId, endpoint);

      if (!result.success) {
        return res.status(400).json({
          erro: true,
          mensagem: result.error
        });
      }

      return res.status(200).json({
        erro: false,
        mensagem: result.message
      });
    } catch (error) {
      console.error('Erro ao remover subscription:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Testa envio de push notification
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async testarPush(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const usuario = req.usuario;

      // Dados de teste
      const notificationData = {
        titulo: '🧪 Teste de Push Notification',
        mensagem: `Olá ${usuario.nome}! Suas notificações push estão funcionando perfeitamente.`,
        tipo: 'TEST',
        prioridade: 5
      };

      const result = await this.pushService.enviarParaUsuario(usuarioId, notificationData);

      if (!result.success) {
        return res.status(400).json({
          erro: true,
          mensagem: result.error
        });
      }

      return res.status(200).json({
        erro: false,
        mensagem: 'Push notification de teste enviada',
        estatisticas: {
          enviadas: result.sent_count,
          falharam: result.failed_count,
          total_subscriptions: result.total_subscriptions
        }
      });
    } catch (error) {
      console.error('Erro ao testar push:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém status das push notifications
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async obterStatus(req, res) {
    try {
      const configurado = this.pushService.estaConfigurado();

      return res.status(200).json({
        erro: false,
        push_notifications: {
          configurado,
          vapid_configurado: !!process.env.VAPID_PUBLIC_KEY,
          chave_publica_disponivel: configurado
        }
      });
    } catch (error) {
      console.error('Erro ao obter status:', error);
       return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = PushNotificationController;