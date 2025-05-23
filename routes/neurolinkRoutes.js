// routes/neurolinkRoutes.js
const express = require('express');
const router = express.Router();
const NeuroLinkController = require('../controllers/neurolinkController');
const authMiddleware = require('../middlewares/authMiddleware');

// Instanciar controlador
const neurolinkController = new NeuroLinkController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/neurolink/generate:
 *   post:
 *     summary: Gerar notificação inteligente com IA
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *             properties:
 *               tarefa_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID da tarefa (opcional)
 *               tipo:
 *                 type: string
 *                 enum: [ALERT, REMINDER, INSIGHT, MOTIVATION, PROGRESS, ACHIEVEMENT]
 *                 example: "REMINDER"
 *               objetivo:
 *                 type: string
 *                 example: "Lembrar usuário de completar tarefa importante"
 *     responses:
 *       201:
 *         description: Notificação gerada com sucesso
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
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     tipo:
 *                       type: string
 *                     titulo:
 *                       type: string
 *                     mensagem:
 *                       type: string
 *                     prioridade:
 *                       type: integer
 *                     agendado_para:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *       429:
 *         description: Limite de notificações atingido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/generate', neurolinkController.gerarNotificacao.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/notifications:
 *   get:
 *     summary: Listar notificações do usuário
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, READ, DISMISSED]
 *         description: Filtrar por status
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ALERT, REMINDER, INSIGHT, MOTIVATION, PROGRESS, ACHIEVEMENT]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite de resultados
 *     responses:
 *       200:
 *         description: Lista de notificações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       tipo:
 *                         type: string
 *                       titulo:
 *                         type: string
 *                       mensagem:
 *                         type: string
 *                       prioridade:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       agendado_para:
 *                         type: string
 *                         format: date-time
 *                       enviado_em:
 *                         type: string
 *                         format: date-time
 *                       lido_em:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/notifications', neurolinkController.listarNotificacoes.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificação como lida
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 *       404:
 *         description: Notificação não encontrada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/notifications/:id/read', neurolinkController.marcarComoLida.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/notifications/{id}/feedback:
 *   post:
 *     summary: Enviar feedback sobre notificação
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da notificação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback_tipo
 *             properties:
 *               feedback_tipo:
 *                 type: string
 *                 enum: [helpful, annoying, irrelevant, perfect, too_early, too_late]
 *                 example: "helpful"
 *               comentario:
 *                 type: string
 *                 example: "Notificação muito útil e no momento certo"
 *     responses:
 *       201:
 *         description: Feedback enviado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Notificação não encontrada
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/notifications/:id/feedback', neurolinkController.enviarFeedback.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/settings:
 *   get:
 *     summary: Obter configurações de notificação
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurações do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 configuracoes:
 *                   type: object
 *                   properties:
 *                     personalidade:
 *                       type: string
 *                       enum: [formal, casual, motivational, friendly]
 *                     horario_inicio:
 *                       type: string
 *                       format: time
 *                     horario_fim:
 *                       type: string
 *                       format: time
 *                     frequencia_maxima:
 *                       type: integer
 *                     tipos_habilitados:
 *                       type: array
 *                       items:
 *                         type: string
 *                     timezone:
 *                       type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/settings', neurolinkController.obterConfiguracoes.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/settings:
 *   put:
 *     summary: Atualizar configurações de notificação
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personalidade:
 *                 type: string
 *                 enum: [formal, casual, motivational, friendly]
 *                 example: "casual"
 *               horario_inicio:
 *                 type: string
 *                 format: time
 *                 example: "07:00"
 *               horario_fim:
 *                 type: string
 *                 format: time
 *                 example: "22:00"
 *               frequencia_maxima:
 *                 type: integer
 *                 example: 5
 *               tipos_habilitados:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ALERT, REMINDER, INSIGHT, MOTIVATION, PROGRESS, ACHIEVEMENT]
 *                 example: ["ALERT", "REMINDER", "MOTIVATION"]
 *               timezone:
 *                 type: string
 *                 example: "America/Sao_Paulo"
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/settings', neurolinkController.atualizarConfiguracoes.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/schedule:
 *   post:
 *     summary: Agendar notificações para uma tarefa
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tarefa_id
 *               - evento
 *             properties:
 *               tarefa_id:
 *                 type: string
 *                 format: uuid
 *               evento:
 *                 type: string
 *                 enum: [TASK_CREATED, TASK_DEADLINE_APPROACHING, TASK_OVERDUE, TASK_COMPLETED]
 *                 example: "TASK_CREATED"
 *     responses:
 *       201:
 *         description: Notificações agendadas com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/schedule', neurolinkController.agendarNotificacoesTarefa.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/stats:
 *   get:
 *     summary: Obter estatísticas do NeuroLink
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_notifications:
 *                       type: integer
 *                     sent_notifications:
 *                       type: integer
 *                     read_notifications:
 *                       type: integer
 *                     read_rate:
 *                       type: string
 *                     types_breakdown:
 *                       type: object
 *                     priority_breakdown:
 *                       type: object
 *                     engagement_score:
 *                       type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', neurolinkController.obterEstatisticas.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/test-ai:
 *   get:
 *     summary: Testar conectividade com IA
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da conectividade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: boolean
 *                   example: false
 *                 ia_conectada:
 *                   type: boolean
 *                 mensagem:
 *                   type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/test-ai', neurolinkController.testarIA.bind(neurolinkController));

/**
 * @swagger
 * /api/neurolink/process-queue:
 *   post:
 *     summary: Processar fila de notificações (administrativo)
 *     tags: [NeuroLink]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fila processada com sucesso
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
 *                 processed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       usuario:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       titulo:
 *                         type: string
 *                       enviado_em:
 *                         type: string
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/process-queue', neurolinkController.processarFila.bind(neurolinkController));

module.exports = router;