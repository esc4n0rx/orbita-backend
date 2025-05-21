// routes/tarefaRoutes.js
const express = require('express');
const router = express.Router();
const TarefaController = require('../controllers/tarefaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/tarefas:
 *   post:
 *     summary: Criar nova tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - descricao
 *               - data_vencimento
 *               - pontos
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Estudar Node.js"
 *               descricao:
 *                 type: string
 *                 example: "Estudar rotas e middlewares do Express"
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-25"
 *               hora_vencimento:
 *                 type: string
 *                 format: time
 *                 example: "18:00"
 *               pontos:
 *                 type: integer
 *                 maximum: 20
 *                 example: 10
 *                 description: "Valor entre 1 e 20 pontos"
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', TarefaController.criar);

/**
 * @swagger
 * /api/tarefas:
 *   get:
 *     summary: Listar todas as tarefas do usuário
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarefas
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', TarefaController.listar);

/**
 * @swagger
 * /api/tarefas/{id}:
 *   get:
 *     summary: Obter tarefa por ID
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Dados da tarefa
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso não autorizado a esta tarefa
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', TarefaController.buscarPorId);

/**
 * @swagger
 * /api/tarefas/{id}:
 *   put:
 *     summary: Atualizar tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *               hora_vencimento:
 *                 type: string
 *                 format: time
 *               pontos:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso não autorizado a esta tarefa
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', TarefaController.atualizar);

/**
 * @swagger
 * /api/tarefas/{id}/adiar:
 *   patch:
 *     summary: Adiar tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data_vencimento
 *             properties:
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-30"
 *               hora_vencimento:
 *                 type: string
 *                 format: time
 *                 example: "19:00"
 *     responses:
 *       200:
 *         description: Tarefa adiada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso não autorizado a esta tarefa
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/adiar', TarefaController.adiar);

/**
 * @swagger
 * /api/tarefas/{id}/concluir:
 *   patch:
 *     summary: Concluir tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa concluída com sucesso
 * 
/**
 * @swagger
 * /api/tarefas/{id}/concluir:
 *   patch:
 *     summary: Concluir tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa concluída com sucesso
 *       400:
 *         description: Tarefa já foi concluída
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso não autorizado a esta tarefa
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/concluir', TarefaController.concluir);

/**
 * @swagger
 * /api/tarefas/{id}:
 *   delete:
 *     summary: Excluir tarefa
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso não autorizado a esta tarefa
 *       404:
 *         description: Tarefa não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', TarefaController.excluir);

module.exports = router;