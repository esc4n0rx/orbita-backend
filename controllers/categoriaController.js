// controllers/categoriaController.js
const CategoriaService = require('../services/categoriaService');
const { categoriaSchema } = require('../utils/validadores');

class CategoriaController {
  // Listar todas as categorias do usuário
  static async listar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      
      const categorias = await CategoriaService.listarCategoriasUsuario(usuarioId);
      
      return res.status(200).json({
        erro: false,
        categorias
      });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Criar nova categoria
  static async criar(req, res) {
    try {
      // Validar dados de entrada
      const resultado = categoriaSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }

      const usuarioId = req.usuario.id;
      const categoria = await CategoriaService.criarCategoria(usuarioId, resultado.data);
      
      return res.status(201).json({
        erro: false,
        mensagem: 'Categoria criada com sucesso',
        categoria
      });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Atualizar categoria
  static async atualizar(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      // Validar dados de entrada
      const resultado = categoriaSchema.partial().safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }
      
      try {
        const categoria = await CategoriaService.atualizarCategoria(id, usuarioId, resultado.data);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Categoria atualizada com sucesso',
          categoria
        });
      } catch (error) {
        if (error.message.includes('não encontrada')) {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message.includes('não pertence') || error.message.includes('padrão')) {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Excluir categoria
  static async excluir(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      try {
        await CategoriaService.excluirCategoria(id, usuarioId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Categoria excluída com sucesso'
        });
      } catch (error) {
        if (error.message.includes('não encontrada')) {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message.includes('não pertence') || error.message.includes('padrão')) {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = CategoriaController;