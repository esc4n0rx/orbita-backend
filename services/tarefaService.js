// services/tarefaService.js - VERSÃO COMPLETA COM INTEGRAÇÃO NEUROLINK

const TarefaModel = require('../models/tarefaModel');
const UsuarioModel = require('../models/usuarioModel');
const NivelModel = require('../models/nivelModel');
const CategoriaModel = require('../models/categoriaModel');
const TagModel = require('../models/tagModel');
const QueueManager = require('../neurolink/queue/QueueManager');
const supabase = require('../config/database');

class TarefaService {
  constructor() {
    this.queueManager = new QueueManager();
  }

  static async criarTarefa(usuarioId, dadosTarefa) {
    if (dadosTarefa.pontos > 20) {
      dadosTarefa.pontos = 20;
    }

    const tarefa = {
      usuario_id: usuarioId,
      nome: dadosTarefa.nome,
      descricao: dadosTarefa.descricao,
      data_vencimento: dadosTarefa.data_vencimento,
      hora_vencimento: dadosTarefa.hora_vencimento || null,
      pontos: dadosTarefa.pontos,
      concluida: false,
      vencida: false,
      data_criacao: new Date().toISOString(),
      data_conclusao: null
    };

    // Criar a tarefa
    const tarefaCriada = await TarefaModel.criarTarefa(tarefa);
    
    // Associar categorias se fornecidas
    if (dadosTarefa.categorias && Array.isArray(dadosTarefa.categorias) && dadosTarefa.categorias.length > 0) {
      for (const categoriaId of dadosTarefa.categorias) {
        await CategoriaModel.associarCategoriaTarefa(tarefaCriada.id, categoriaId);
      }
    }
    
    // Associar tags se fornecidas
    if (dadosTarefa.tags && Array.isArray(dadosTarefa.tags) && dadosTarefa.tags.length > 0) {
      for (const tagId of dadosTarefa.tags) {
        await TagModel.associarTagTarefa(tarefaCriada.id, tagId);
      }
    }

    // Obter categorias e tags associadas
    const categorias = await CategoriaModel.listarCategoriasTarefa(tarefaCriada.id);
    const tags = await TagModel.listarTagsTarefa(tarefaCriada.id);
    
    // 🧠 NEUROLINK: Agendar notificações da tarefa
    try {
      const queueManager = new QueueManager();
      await queueManager.scheduleTaskNotifications(
        tarefaCriada.id,
        usuarioId,
        'TASK_CREATED'
      );
      console.log(`✅ Notificações agendadas para tarefa ${tarefaCriada.id}`);
    } catch (error) {
      console.warn('⚠️ Erro ao agendar notificações da tarefa:', error);
      // Não falhar a criação da tarefa por causa das notificações
    }
    
    // Retornar tarefa com categorias e tags
    return {
      ...tarefaCriada,
      categorias,
      tags
    };
  }

  static async listarTarefas(usuarioId) {
    // Verificar tarefas vencidas antes de listar
    await this.verificarTarefasVencidas();
    
    const tarefas = await TarefaModel.listarTarefasPorUsuario(usuarioId);
    
    // Para cada tarefa, obter suas categorias e tags
    const tarefasCompletas = await Promise.all(tarefas.map(async (tarefa) => {
      const categorias = await CategoriaModel.listarCategoriasTarefa(tarefa.id);
      const tags = await TagModel.listarTagsTarefa(tarefa.id);
      
      return {
        ...tarefa,
        categorias,
        tags
      };
    }));
    
    return tarefasCompletas;
  }

  static async obterTarefa(id, usuarioId) {
    const tarefa = await TarefaModel.buscarTarefaPorId(id);
    
    if (!tarefa) {
      throw new Error('Tarefa não encontrada');
    }
    
    // Verificar se a tarefa pertence ao usuário
    if (tarefa.usuario_id !== usuarioId) {
      throw new Error('Acesso não autorizado a esta tarefa');
    }
    
    // Obter categorias e tags da tarefa
    const categorias = await CategoriaModel.listarCategoriasTarefa(id);
    const tags = await TagModel.listarTagsTarefa(id);
    
    // Adicionar categorias e tags à tarefa
    return {
      ...tarefa,
      categorias,
      tags
    };
  }

  static async atualizarTarefa(id, usuarioId, dadosTarefa) {
    // Verificar se a tarefa existe e pertence ao usuário
    const tarefaExistente = await this.obterTarefa(id, usuarioId);
    
    // Garantir que os pontos não excedam 20
    if (dadosTarefa.pontos && dadosTarefa.pontos > 20) {
      dadosTarefa.pontos = 20;
    }
    
    // Atualizar apenas os campos permitidos
    const atualizacoes = {};
    if (dadosTarefa.nome) atualizacoes.nome = dadosTarefa.nome;
    if (dadosTarefa.descricao) atualizacoes.descricao = dadosTarefa.descricao;
    if (dadosTarefa.data_vencimento) atualizacoes.data_vencimento = dadosTarefa.data_vencimento;
    if (dadosTarefa.hora_vencimento !== undefined) atualizacoes.hora_vencimento = dadosTarefa.hora_vencimento;
    if (dadosTarefa.pontos) atualizacoes.pontos = dadosTarefa.pontos;
    
    const tarefaAtualizada = await TarefaModel.atualizarTarefa(id, atualizacoes);

    // 🧠 NEUROLINK: Se a data de vencimento mudou, reagendar notificações
    if (dadosTarefa.data_vencimento && dadosTarefa.data_vencimento !== tarefaExistente.data_vencimento) {
      try {
        const queueManager = new QueueManager();
        await queueManager.scheduleTaskNotifications(
          id,
          usuarioId,
          'TASK_UPDATED'
        );
        console.log(`🔄 Notificações reagendadas para tarefa ${id}`);
      } catch (error) {
        console.warn('⚠️ Erro ao reagendar notificações:', error);
      }
    }

    return tarefaAtualizada;
  }

  static async adiarTarefa(id, usuarioId, novaData, novaHora) {
    // Verificar se a tarefa existe e pertence ao usuário
    const tarefaExistente = await this.obterTarefa(id, usuarioId);
    
    if (tarefaExistente.concluida) {
      throw new Error('Não é possível adiar uma tarefa já concluída');
    }
    
    // Reduzir 3 pontos ao adiar (mínimo de 1 ponto)
    let novosPontos = Math.max(1, tarefaExistente.pontos - 3);
    
    const atualizacoes = {
      data_vencimento: novaData,
      pontos: novosPontos
    };
    
    if (novaHora !== undefined) {
      atualizacoes.hora_vencimento = novaHora;
    }
    
    const tarefaAdiada = await TarefaModel.atualizarTarefa(id, atualizacoes);

    // 🧠 NEUROLINK: Notificar sobre o adiamento e reagendar lembretes
    try {
      const queueManager = new QueueManager();
      
      // Notificação imediata sobre penalização
      await queueManager.enqueue({
        usuario_id: usuarioId,
        tarefa_id: id,
        tipo: 'ALERT',
        objective: 'Informar sobre penalidade por adiamento de tarefa'
      });

      // Reagendar lembretes para nova data
      await queueManager.scheduleTaskNotifications(
        id,
        usuarioId,
        'TASK_RESCHEDULED'
      );

      console.log(`⏰ Notificações de adiamento enviadas para tarefa ${id}`);
    } catch (error) {
      console.warn('⚠️ Erro ao processar notificações de adiamento:', error);
    }
    
    return tarefaAdiada;
  }

  static async concluirTarefa(id, usuarioId) {
    // Verificar se a tarefa existe e pertence ao usuário
    const tarefa = await this.obterTarefa(id, usuarioId);
    
    if (tarefa.concluida) {
      throw new Error('Tarefa já foi concluída');
    }
    
    // Verificar se a tarefa está vencida
    const dataAtual = new Date();
    const dataVencimento = new Date(tarefa.data_vencimento);
    dataVencimento.setHours(23, 59, 59, 999); // Fim do dia
    
    if (dataAtual > dataVencimento) {
      // A tarefa está vencida, marcar como concluída mas vencida
      const tarefaVencida = await TarefaModel.marcarComoVencida(id);
      
      // 🧠 NEUROLINK: Notificar conclusão tardia
      try {
        const queueManager = new QueueManager();
        await queueManager.enqueue({
          usuario_id: usuarioId,
          tarefa_id: id,
          tipo: 'INSIGHT',
          objective: 'Informar sobre conclusão de tarefa vencida e dar dicas'
        });
      } catch (error) {
        console.warn('⚠️ Erro ao enviar notificação de tarefa vencida:', error);
      }
      
      return {
        ...tarefaVencida,
        mensagem: "Tarefa vencida. Nenhum ponto foi adicionado."
      };
    }
    
    // Concluir a tarefa normalmente
    const tarefaConcluida = await TarefaModel.concluirTarefa(id);
    
    // Atualizar pontos do usuário
    const usuario = await UsuarioModel.buscarPorId(usuarioId);
    let novosPontos = usuario.pontos_xp + tarefa.pontos;
    
    // Verificar se o usuário deve subir de nível
    const nivelAtual = usuario.nivel;
    const dadosNivel = await NivelModel.buscarPontosPorNivel(nivelAtual);
    
    let subeuNivel = false;
    if (dadosNivel && novosPontos >= dadosNivel.pontos_necessarios) {
      // Subir de nível
      const novoNivel = nivelAtual + 1;
      // Manter apenas os pontos extras
      novosPontos = novosPontos - dadosNivel.pontos_necessarios;
      
      await UsuarioModel.atualizarNivel(usuarioId, novoNivel, novosPontos);
      subeuNivel = true;
    } else {
      // Só atualizar pontos
      await UsuarioModel.atualizarPontosESequencia(usuarioId, novosPontos, usuario.sequencia);
    }
    
    // Calcular e atualizar sequência (streak)
    const novaSequencia = await this.atualizarSequencia(usuarioId);
    
    // 🧠 NEUROLINK: Enviar notificações de conquista
    try {
      const queueManager = new QueueManager();
      
      // Notificação de conclusão
      await queueManager.scheduleTaskNotifications(
        id,
        usuarioId,
        'TASK_COMPLETED'
      );

      // Se subiu de nível, notificação especial
      if (subeuNivel) {
        await queueManager.enqueue({
          usuario_id: usuarioId,
          tipo: 'ACHIEVEMENT',
          objective: `Parabenizar por subir para o nível ${nivelAtual + 1}`
        });
      }

      // Se quebrou recorde de sequência, notificação especial
      if (novaSequencia > usuario.sequencia && novaSequencia >= 7) {
        await queueManager.enqueue({
          usuario_id: usuarioId,
          tipo: 'ACHIEVEMENT',
          objective: `Parabenizar por ${novaSequencia} dias consecutivos de produtividade`
        });
      }

      console.log(`🎉 Notificações de conquista enviadas para usuário ${usuarioId}`);
    } catch (error) {
      console.warn('⚠️ Erro ao enviar notificações de conquista:', error);
    }
    
    return tarefaConcluida;
  }

  static async excluirTarefa(id, usuarioId) {
    // Verificar se a tarefa existe e pertence ao usuário
    await this.obterTarefa(id, usuarioId);
    
    // 🧠 NEUROLINK: Cancelar notificações pendentes da tarefa
    try {
      const NotificationModel = require('../neurolink/models/notificationModel');
      const { data: pendingNotifications } = await supabase
        .from('orbita_notifications')
        .select('id')
        .eq('tarefa_id', id)
        .eq('status', 'PENDING');

      for (const notification of pendingNotifications || []) {
        await NotificationModel.atualizarStatus(notification.id, 'DISMISSED');
      }
      
      console.log(`🗑️ ${pendingNotifications?.length || 0} notificações canceladas para tarefa ${id}`);
    } catch (error) {
      console.warn('⚠️ Erro ao cancelar notificações da tarefa:', error);
    }
    
    // Excluir a tarefa
    return await TarefaModel.excluirTarefa(id);
  }

  // 🧠 NEUROLINK: Novos métodos para automação
  
  /**
   * Verifica prazos próximos e agenda lembretes
   */
  static async verificarPrazosProximos() {
    try {
      // Buscar tarefas que vencem nas próximas 24 horas
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();
      
      const { data: tarefasProximas, error } = await supabase
        .from('orbita_tarefas')
        .select('id, usuario_id, nome, data_vencimento, pontos')
        .eq('concluida', false)
        .eq('vencida', false)
        .lte('data_vencimento', tomorrow.toISOString().split('T')[0])
        .gt('data_vencimento', today.toISOString().split('T')[0]);

      if (error) {
        console.error('Erro ao buscar tarefas próximas:', error);
        return 0;
      }
      
      const queueManager = new QueueManager();
      
      for (const tarefa of tarefasProximas || []) {
        try {
          await queueManager.scheduleTaskNotifications(
            tarefa.id,
            tarefa.usuario_id,
            'TASK_DEADLINE_APPROACHING'
          );
        } catch (error) {
          console.warn(`⚠️ Erro ao agendar lembrete para tarefa ${tarefa.id}:`, error);
        }
      }
      
      console.log(`⏰ ${tarefasProximas?.length || 0} lembretes de prazo agendados`);
      return tarefasProximas?.length || 0;
    } catch (error) {
      console.error('Erro ao verificar prazos próximos:', error);
      return 0;
    }
  }

  /**
   * Verifica tarefas vencidas e agenda notificações
   */
  static async verificarTarefasVencidas() {
    try {
      const tarefasVencidas = await TarefaModel.listarTarefasVencidas();
      const queueManager = new QueueManager();
      
      for (const tarefa of tarefasVencidas) {
        // Marcar como vencida
        await TarefaModel.marcarComoVencida(tarefa.id);
        
        // Agendar notificação de tarefa vencida
        try {
          await queueManager.scheduleTaskNotifications(
            tarefa.id,
            tarefa.usuario_id,
            'TASK_OVERDUE'
          );
        } catch (error) {
          console.warn(`⚠️ Erro ao agendar notificação de vencimento para tarefa ${tarefa.id}:`, error);
        }
      }
      
      console.log(`🚨 ${tarefasVencidas.length} tarefas vencidas processadas`);
      return tarefasVencidas.length;
    } catch (error) {
      console.error('Erro ao verificar tarefas vencidas:', error);
      return 0;
    }
  }

  /**
   * Gera insights de produtividade
   */
  static async gerarInsightsProdutividade(usuarioId) {
    try {
      const queueManager = new QueueManager();
      
      // Buscar estatísticas do usuário
      const usuario = await UsuarioModel.buscarPorId(usuarioId);
      const tarefas = await TarefaModel.listarTarefasPorUsuario(usuarioId);
      
      const tarefasCompletas = tarefas.filter(t => t.concluida);
      const taxaConclusao = tarefas.length > 0 ? tarefasCompletas.length / tarefas.length : 0;
      
      // Determinar tipo de insight baseado no desempenho
      let tipoInsight = 'PROGRESS';
      let objetivo = 'Fornecer estatísticas de produtividade semanal';
      
      if (taxaConclusao >= 0.8) {
        tipoInsight = 'ACHIEVEMENT';
        objetivo = 'Parabenizar pelo excelente desempenho e sugerir novos desafios';
      } else if (taxaConclusao <= 0.4) {
        tipoInsight = 'MOTIVATION';
        objetivo = 'Motivar a melhorar produtividade com dicas personalizadas';
      }
      
      await queueManager.enqueue({
        usuario_id: usuarioId,
        tipo: tipoInsight,
        objective: objetivo
      });
      
      console.log(`📊 Insight de produtividade gerado para usuário ${usuarioId}`);
      return true;
    } catch (error) {
      console.error('Erro ao gerar insights de produtividade:', error);
      return false;
    }
  }

  // Métodos existentes continuam iguais...
  static async atualizarSequencia(usuarioId) {
    const tarefasConcluidas = await TarefaModel.contarTarefasConsecutivas(usuarioId);
    const usuario = await UsuarioModel.buscarPorId(usuarioId);
    
    // Pegar apenas tarefas não vencidas para sequência
    const tarefasConcluidasNaoVencidas = tarefasConcluidas.filter(tarefa => !tarefa.vencida);
    
    // Verificar se tem tarefas concluídas hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const tarefasHoje = tarefasConcluidasNaoVencidas.filter(tarefa => {
      const dataConclusao = new Date(tarefa.data_conclusao);
      dataConclusao.setHours(0, 0, 0, 0);
      return dataConclusao.getTime() === hoje.getTime();
    });
    
    // Verificar se teve tarefas concluídas ontem
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    const tarefasOntem = tarefasConcluidasNaoVencidas.filter(tarefa => {
      const dataConclusao = new Date(tarefa.data_conclusao);
      dataConclusao.setHours(0, 0, 0, 0);
      return dataConclusao.getTime() === ontem.getTime();
    });
    
    let novaSequencia = usuario.sequencia;
    
    if (tarefasHoje.length > 0) {
      if (tarefasOntem.length > 0 || usuario.sequencia === 0) {
        // Se completou tarefas hoje e ontem (ou é a primeira vez), incrementa a sequência
        novaSequencia += 1;
      }
    } else {
      // Se não completou tarefas hoje, resetar sequência
      novaSequencia = 0;
    }
    
    // Atualizar sequência do usuário
    await UsuarioModel.atualizarPontosESequencia(usuarioId, usuario.pontos_xp, novaSequencia);
    
    return novaSequencia;
  }
}

module.exports = TarefaService;