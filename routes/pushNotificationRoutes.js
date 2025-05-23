// routes/pushNotificationRoutes.js
const express = require('express');
const router = express.Router();
const PushNotificationController = require('../controllers/pushNotificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Instanciar controlador
const pushController = new PushNotificationController();

/**
 * @swagger
 * /api/push/public-key:
 *   get:
 *     summary: Obter chave pública VAPID
 *     tags: [Push Notifications]
 *     responses:
 *       200:
 *         description: Chave pública VAPID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 public_key:
 *                   type: string
 *                   example: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
 *                 configurado:
 *                   type: boolean
 *                   example: true
 *       503:
 *         description: Push notifications não configuradas
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/public-key', pushController.obterChavePublica.bind(pushController));

/**
 * @swagger
 * /api/push/status:
 *   get:
 *     summary: Obter status das push notifications
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status das configurações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 push_notifications:
 *                   type: object
 *                   properties:
 *                     configurado:
 *                       type: boolean
 *                     vapid_configurado:
 *                       type: boolean
 *                     chave_publica_disponivel:
 *                       type: boolean
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/status', authMiddleware, pushController.obterStatus.bind(pushController));

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     summary: Registrar subscription para push notifications
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription
 *             properties:
 *               subscription:
 *                 type: object
 *                 required:
 *                   - endpoint
 *                   - keys
 *                 properties:
 *                   endpoint:
 *                     type: string
 *                     format: uri
 *                     example: "https://fcm.googleapis.com/fcm/send/..."
 *                   keys:
 *                     type: object
 *                     required:
 *                       - p256dh
 *                       - auth
 *                     properties:
 *                       p256dh:
 *                         type: string
 *                         example: "BEl62iUYgUivxIkv69yViEuiBIa..."
 *                       auth:
 *                         type: string
 *                         example: "tBHItJI5svbpez7GH6L"
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   userAgent:
 *                     type: string
 *                     example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
 *                   platform:
 *                     type: string
 *                     example: "Win32"
 *     responses:
 *       201:
 *         description: Subscription registrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 mensagem:
 *                   type: string
 *                   example: "Push notifications ativadas com sucesso"
 *                 subscription_id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/subscribe', authMiddleware, pushController.registrarSubscription.bind(pushController));

/**
 * @swagger
 * /api/push/unsubscribe:
 *   post:
 *     summary: Remover subscription de push notifications
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 format: uri
 *                 example: "https://fcm.googleapis.com/fcm/send/..."
 *     responses:
 *       200:
 *         description: Subscription removida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 mensagem:
 *                   type: string
 *                   example: "Push notifications desativadas"
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/unsubscribe', authMiddleware, pushController.removerSubscription.bind(pushController));

/**
 * @swagger
 * /api/push/test:
 *   post:
 *     summary: Testar envio de push notification
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Push notification de teste enviada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 mensagem:
 *                   type: string
 *                   example: "Push notification de teste enviada"
 *                 estatisticas:
 *                   type: object
 *                   properties:
 *                     enviadas:
 *                       type: integer
 *                     falharam:
 *                       type: integer
 *                     total_subscriptions:
 *                       type: integer
 *       400:
 *         description: Erro no envio
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/test', authMiddleware, pushController.testarPush.bind(pushController));

module.exports = router;