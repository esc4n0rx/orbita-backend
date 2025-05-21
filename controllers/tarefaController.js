// controllers/tarefaController.js
const TarefaService = require('../services/tarefaService');
const CategoriaService = require('../services/categoriaService');
const TagService = require('../services/tagService');
const { 
  tarefaSchema, 
  adiarTarefaSchema, 
  associarCategoriaSchema, 
  associarTagSchema 
} = require('../utils/validadores');

class TarefaController {
  static async criar(req, res) {
    try {
      // Validar dados de entrada
      const resultado = tarefaSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }

      // Pegar ID do usuário autenticado
      const usuarioId = req.usuario.id;
      
      // Criar tarefa
      const tarefa = await TarefaService.criarTarefa(usuarioId, resultado.data);
      
      return res.status(201).json({
        erro: false,
        mensagem: 'Tarefa criada com sucesso',
        tarefa
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  static async listar(req, res) {
    try {
      // Pegar ID do usuário autenticado
      const usuarioId = req.usuario.id;
      
      // Listar tarefas
      const tarefas = await TarefaService.listarTarefas(usuarioId);
      
      return res.status(200).json({
        erro: false,
        tarefas
      });
    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  static async buscarPorId(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      try {
        const tarefa = await TarefaService.obterTarefa(id, usuarioId);
        
        return res.status(200).json({
          erro: false,
          tarefa
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  static async atualizar(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      // Validar dados de entrada - validação parcial
      const resultado = tarefaSchema.partial().safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }
      
      try {
        const tarefa = await TarefaService.atualizarTarefa(id, usuarioId, resultado.data);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Tarefa atualizada com sucesso',
          tarefa
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  static async adiar(req, res) {
  try {
    const id = req.params.id;
    const usuarioId = req.usuario.id;
    
    // Validar dados de entrada
    const resultado = adiarTarefaSchema.safeParse(req.body);
    if (!resultado.success) {
      return res.status(400).json({ 
        erro: true, 
        mensagem: 'Dados inválidos', 
        detalhes: resultado.error.issues 
      });
    }
    
    try {
      const tarefa = await TarefaService.adiarTarefa(
        id, 
        usuarioId, 
        resultado.data.data_vencimento, 
        resultado.data.hora_vencimento
      );
      
      return res.status(200).json({
        erro: false,
        mensagem: 'Tarefa adiada com sucesso. Você perdeu 3 pontos desta tarefa.',
        tarefa
      });
    } catch (error) {
      if (error.message === 'Tarefa não encontrada') {
        return res.status(404).json({ erro: true, mensagem: error.message });
      } else if (error.message === 'Acesso não autorizado a esta tarefa') {
        return res.status(403).json({ erro: true, mensagem: error.message });
      } else if (error.message === 'Não é possível adiar uma tarefa já concluída') {
        return res.status(400).json({ erro: true, mensagem: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao adiar tarefa:', error);
    return res.status(500).json({ 
      erro: true, 
      mensagem: 'Erro interno do servidor' 
    });
  }
}

  static async concluir(req, res) {
  try {
    const id = req.params.id;
    const usuarioId = req.usuario.id;
    
    try {
      const tarefa = await TarefaService.concluirTarefa(id, usuarioId);
      
      if (tarefa.vencida) {
        return res.status(200).json({
          erro: false,
          mensagem: 'Tarefa marcada como vencida. Nenhum ponto foi adicionado.',
          tarefa
        });
      }
      
      return res.status(200).json({
        erro: false,
        mensagem: 'Tarefa concluída com sucesso',
        tarefa
      });
    } catch (error) {
      if (error.message === 'Tarefa não encontrada') {
        return res.status(404).json({ erro: true, mensagem: error.message });
      } else if (error.message === 'Acesso não autorizado a esta tarefa') {
        return res.status(403).json({ erro: true, mensagem: error.message });
      } else if (error.message === 'Tarefa já foi concluída') {
        return res.status(400).json({ erro: true, mensagem: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erro ao concluir tarefa:', error);
    return res.status(500).json({ 
      erro: true, 
      mensagem: 'Erro interno do servidor' 
    });
  }
}

  static async excluir(req, res) {
    try {
      const id = req.params.id;
      const usuarioId = req.usuario.id;
      
      try {
        await TarefaService.excluirTarefa(id, usuarioId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Tarefa excluída com sucesso'
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

   static async adicionarCategoria(req, res) {
    try {
      const tarefaId = req.params.id;
      const usuarioId = req.usuario.id;
      
      // Validar dados de entrada
      const resultado = associarCategoriaSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }
      
      const categoriaId = resultado.data.categoria_id;
      
      try {
        // Verificar se a tarefa pertence ao usuário
        await TarefaService.obterTarefa(tarefaId, usuarioId);
        
        // Adicionar categoria à tarefa
        await CategoriaService.associarCategoriaTarefa(tarefaId, categoriaId);
        
        // Obter categorias atualizadas da tarefa
        const categorias = await CategoriaService.listarCategoriasTarefa(tarefaId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Categoria adicionada à tarefa com sucesso',
          categorias
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao adicionar categoria à tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Remover categoria de uma tarefa
  static async removerCategoria(req, res) {
    try {
      const tarefaId = req.params.tarefaId;
      const categoriaId = req.params.categoriaId;
      const usuarioId = req.usuario.id;
      
      try {
        // Verificar se a tarefa pertence ao usuário
        await TarefaService.obterTarefa(tarefaId, usuarioId);
        
        // Remover categoria da tarefa
        await CategoriaService.removerCategoriaTarefa(tarefaId, categoriaId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Categoria removida da tarefa com sucesso'
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao remover categoria da tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Listar categorias de uma tarefa
  static async listarCategorias(req, res) {
    try {
      const tarefaId = req.params.id;
      const usuarioId = req.usuario.id;
      
      try {
        // Verificar se a tarefa pertence ao usuário
        await TarefaService.obterTarefa(tarefaId, usuarioId);
        
        // Listar categorias da tarefa
        const categorias = await CategoriaService.listarCategoriasTarefa(tarefaId);
        
        return res.status(200).json({
          erro: false,
          categorias
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao listar categorias da tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Adicionar tag a uma tarefa
  static async adicionarTag(req, res) {
    try {
      const tarefaId = req.params.id;
      const usuarioId = req.usuario.id;
      
      // Validar dados de entrada
      const resultado = associarTagSchema.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({ 
          erro: true, 
          mensagem: 'Dados inválidos', 
          detalhes: resultado.error.issues 
        });
      }
      
      const tagId = resultado.data.tag_id;
      
      try {
        // Verificar se a tarefa pertence ao usuário
        await TarefaService.obterTarefa(tarefaId, usuarioId);
        
        // Adicionar tag à tarefa
        await TagService.associarTagTarefa(tarefaId, tagId);
        
        // Obter tags atualizadas da tarefa
        const tags = await TagService.listarTagsTarefa(tarefaId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Tag adicionada à tarefa com sucesso',
          tags
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao adicionar tag à tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Remover tag de uma tarefa
  static async removerTag(req, res) {
    try {
      const tarefaId = req.params.tarefaId;
      const tagId = req.params.tagId;
      const usuarioId = req.usuario.id;
      
      try {
        // Verificar se a tarefa pertence ao usuário
        await TarefaService.obterTarefa(tarefaId, usuarioId);
        
        // Remover tag da tarefa
        await TagService.removerTagTarefa(tarefaId, tagId);
        
        return res.status(200).json({
          erro: false,
          mensagem: 'Tag removida da tarefa com sucesso'
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao remover tag da tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }

  // Listar tags de uma tarefa
  static async listarTags(req, res) {
    try {
      const tarefaId = req.params.id;
      const usuarioId = req.usuario.id;
      
      try {
        // Verificar se a tarefa pertence ao usuário
        await TarefaService.obterTarefa(tarefaId, usuarioId);
        
        // Listar tags da tarefa
        const tags = await TagService.listarTagsTarefa(tarefaId);
        
        return res.status(200).json({
          erro: false,
          tags
        });
      } catch (error) {
        if (error.message === 'Tarefa não encontrada') {
          return res.status(404).json({ erro: true, mensagem: error.message });
        } else if (error.message === 'Acesso não autorizado a esta tarefa') {
          return res.status(403).json({ erro: true, mensagem: error.message });
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao listar tags da tarefa:', error);
      return res.status(500).json({ 
        erro: true, 
        mensagem: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = TarefaController;