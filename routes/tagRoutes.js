// routes/tagRoutes.js
const express = require('express');
const router = express.Router();
const TagController = require('../controllers/tagController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Listar todas as tags do usuário
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tags
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', TagController.listar);

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Criar nova tag
 *     tags: [Tags]
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
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "Urgente"
 *               cor:
 *                 type: string
 *                 example: "#FF0000"
 *     responses:
 *       201:
 *         description: Tag criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', TagController.criar);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Atualizar tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tag atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Tag padrão ou não pertence ao usuário
 *       404:
 *         description: Tag não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', TagController.atualizar);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Excluir tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     responses:
 *       200:
 *         description: Tag excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Tag padrão ou não pertence ao usuário
 *       404:
 *         description: Tag não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', TagController.excluir);

module.exports = router;