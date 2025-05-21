// controllers/tarefaController.js
const TarefaService = require('../services/tarefaService');
const { tarefaSchema, adiarTarefaSchema } = require('../utils/validadores');

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
}

module.exports = TarefaController;