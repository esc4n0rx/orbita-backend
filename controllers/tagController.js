// controllers/tagController.js
const TagService = require('../services/tagService');
const { tagSchema } = require('../utils/validadores');

class TagController {
  // Listar todas as tags do usuário
  static async listar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      
      const tags = await TagService.listarTagsUsuario(usuarioId);
      
      return res.status(200).json({
        erro: false,
        tags
      });
    } catch (error) {
      console.error('Erro ao listar tags:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Criar nova tag
  static async criar(req, res) {
    try {
      // Validar dados de entrada
      const resultado = tagSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }

      const usuarioId = req.usuario.id;
      const tag = await TagService.criarTag(usuarioId, resultado.data);
      
      return res.status(201).json({
        erro: false,
        mensagem: 'Tag criada com sucesso',
        tag
      });
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Atualizar tag
  static async atualizar(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      // Validar dados de entrada
      const resultado = tagSchema.partial().safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }
      
      try {
        const tag = await TagService.atualizarTag(id, usuarioId, resultado.data);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Tag atualizada com sucesso',
          tag
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
      console.error('Erro ao atualizar tag:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Excluir tag
  static async excluir(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      try {
        await TagService.excluirTag(id, usuarioId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Tag excluída com sucesso'
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
      console.error('Erro ao excluir tag:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = TagController;