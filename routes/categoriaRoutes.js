// routes/categoriaRoutes.js
const express = require('express');
const router = express.Router();
const CategoriaController = require('../controllers/categoriaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar todas as categorias do usuário
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', CategoriaController.listar);

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Criar nova categoria
 *     tags: [Categorias]
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
 *                 example: "Trabalho"
 *               cor:
 *                 type: string
 *                 example: "#FF5733"
 *               icone:
 *                 type: string
 *                 example: "briefcase"
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', CategoriaController.criar);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da categoria
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
 *               icone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Categoria padrão ou não pertence ao usuário
 *       404:
 *         description: Categoria não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', CategoriaController.atualizar);

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Excluir categoria
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Categoria padrão ou não pertence ao usuário
 *       404:
 *         description: Categoria não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', CategoriaController.excluir);

module.exports = router;