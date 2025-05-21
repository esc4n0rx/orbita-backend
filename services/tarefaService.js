// services/tarefaService.js
const TarefaModel = require('../models/tarefaModel');
const UsuarioModel = require('../models/usuarioModel');
const NivelModel = require('../models/nivelModel');

class TarefaService {
  static async criarTarefa(usuarioId, dadosTarefa) {
    // Garantir que os pontos não excedam 20
    if (dadosTarefa.pontos > 20) {
      dadosTarefa.pontos = 20;
    }
    
    // Preparar dados da tarefa
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

    return await TarefaModel.criarTarefa(tarefa);
  }

  static async listarTarefas(usuarioId) {
    // Verificar tarefas vencidas antes de listar
    await this.verificarTarefasVencidas();
    
    return await TarefaModel.listarTarefasPorUsuario(usuarioId);
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
    
    return tarefa;
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
    
    return await TarefaModel.atualizarTarefa(id, atualizacoes);
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
    
    return await TarefaModel.atualizarTarefa(id, atualizacoes);
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
      
      // Notificar o usuário que a tarefa está vencida e não ganhou pontos
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
    
    if (dadosNivel && novosPontos >= dadosNivel.pontos_necessarios) {
      // Subir de nível
      const novoNivel = nivelAtual + 1;
      // Manter apenas os pontos extras
      novosPontos = novosPontos - dadosNivel.pontos_necessarios;
      
      await UsuarioModel.atualizarNivel(usuarioId, novoNivel, novosPontos);
    } else {
      // Só atualizar pontos
      await UsuarioModel.atualizarPontosESequencia(usuarioId, novosPontos, usuario.sequencia);
    }
    
    // Calcular e atualizar sequência (streak)
    await this.atualizarSequencia(usuarioId);
    
    return tarefaConcluida;
  }

  static async excluirTarefa(id, usuarioId) {
    // Verificar se a tarefa existe e pertence ao usuário
    await this.obterTarefa(id, usuarioId);
    
    // Excluir a tarefa
    return await TarefaModel.excluirTarefa(id);
  }

  static async verificarTarefasVencidas() {
    // Pegar todas as tarefas vencidas (data_vencimento < data atual e não concluídas)
    const tarefasVencidas = await TarefaModel.listarTarefasVencidas();
    
    for (const tarefa of tarefasVencidas) {
      // Marcar cada tarefa como vencida
      await TarefaModel.marcarComoVencida(tarefa.id);
      
      // Opcionalmente, poderíamos subtrair pontos do usuário aqui,
      // mas vamos apenas não dar pontos para tarefas vencidas
    }
    
    return tarefasVencidas.length;
  }

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