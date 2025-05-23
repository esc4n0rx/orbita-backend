
const QueueManager = require('../neurolink/queue/QueueManager');
const NotificationModel = require('../neurolink/models/notificationModel');
const AIEngine = require('../neurolink/core/AIEngine');
const { neurolinkValidators } = require('../utils/validadores');

class NeuroLinkController {
  constructor() {
    this.queueManager = new QueueManager();
    this.aiEngine = new AIEngine();
  }

  /**
   * Gera uma notificação usando IA
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async gerarNotificacao(req, res) {
    try {
      // Validar dados de entrada
      const resultado = neurolinkValidators.gerarNotificacao.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({
          erro: true,
          mensagem: 'Dados inválidos',
          detalhes: resultado.error.issues
        });
      }

      const { tarefa_id, tipo, objetivo } = resultado.data;
      const usuarioId = req.usuario.id;

      // Adicionar à fila
      const notification = await this.queueManager.enqueue({
        usuario_id: usuarioId,
        tarefa_id,
        tipo,
        objective: objetivo
      });

      if (!notification) {
        return res.status(429).json({
          erro: true,
          mensagem: 'Limite de notificações atingido ou notificação duplicada'
        });
      }

      return res.status(201).json({
        erro: false,
        mensagem: 'Notificação gerada e adicionada à fila',
        notification: {
          id: notification.id,
          tipo: notification.tipo,
          titulo: notification.titulo,
          mensagem: notification.mensagem,
          prioridade: notification.prioridade,
          agendado_para: notification.agendado_para
        }
      });
    } catch (error) {
      console.error('Erro ao gerar notificação:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Lista notificações do usuário
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async listarNotificacoes(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { status, tipo, limite = 20 } = req.query;

      const filtros = { limite: parseInt(limite) };
      if (status) filtros.status = status;
      if (tipo) filtros.tipo = tipo;

      const notifications = await NotificationModel.listarPorUsuario(usuarioId, filtros);

      return res.status(200).json({
        erro: false,
        notifications: notifications.map(n => ({
          id: n.id,
          tipo: n.tipo,
          titulo: n.titulo,
          mensagem: n.mensagem,
          prioridade: n.prioridade,
          status: n.status,
          agendado_para: n.agendado_para,
          enviado_em: n.enviado_em,
          lido_em: n.lido_em,
          criado_em: n.criado_em,
          metadata: n.metadata
        })),
        total: notifications.length
      });
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  async marcarComoLida(req, res) {
    try {
      const notificationId = req.params.id;
      const usuarioId = req.usuario.id;

      // Verificar se a notificação pertence ao usuário
      const notifications = await NotificationModel.listarPorUsuario(usuarioId, { limite: 1000 });
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({
          erro: true,
          mensagem: 'Notificação não encontrada'
        });
      }

      // Atualizar status
      const updatedNotification = await NotificationModel.atualizarStatus(
        notificationId,
        'read'
      );

      return res.status(200).json({
        erro: false,
        mensagem: 'Notificação marcada como lida',
        notification: {
          id: updatedNotification.id,
          status: updatedNotification.status,
          lido_em: updatedNotification.lido_em
        }
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Envia feedback sobre uma notificação
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async enviarFeedback(req, res) {
    try {
      const notificationId = req.params.id;
      const usuarioId = req.usuario.id;

      // Validar dados de entrada
      const resultado = neurolinkValidators.feedback.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({
          erro: true,
          mensagem: 'Dados inválidos',
          detalhes: resultado.error.issues
        });
      }

      const { feedback_tipo, comentario } = resultado.data;

      // Verificar se a notificação existe e pertence ao usuário
      const notifications = await NotificationModel.listarPorUsuario(usuarioId, { limite: 1000 });
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({
          erro: true,
          mensagem: 'Notificação não encontrada'
        });
      }

      // Salvar feedback
      const feedback = await NotificationModel.salvarFeedback({
        notification_id: notificationId,
        usuario_id: usuarioId,
        feedback_tipo,
        comentario
      });

      return res.status(201).json({
        erro: false,
        mensagem: 'Feedback enviado com sucesso',
        feedback: {
          id: feedback.id,
          feedback_tipo: feedback.feedback_tipo,
          comentario: feedback.comentario,
          criado_em: feedback.criado_em
        }
      });
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Busca configurações de notificação do usuário
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async obterConfiguracoes(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const configuracoes = await NotificationModel.buscarConfiguracoes(usuarioId);

      return res.status(200).json({
        erro: false,
        configuracoes: {
          personalidade: configuracoes.personalidade,
          horario_inicio: configuracoes.horario_inicio,
          horario_fim: configuracoes.horario_fim,
          frequencia_maxima: configuracoes.frequencia_maxima,
          tipos_habilitados: configuracoes.tipos_habilitados,
          timezone: configuracoes.timezone
        }
      });
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza configurações de notificação do usuário
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async atualizarConfiguracoes(req, res) {
    try {
      const usuarioId = req.usuario.id;

      // Validar dados de entrada
      const resultado = neurolinkValidators.configuracoes.safeParse(req.body);
      if (!resultado.success) {
        return res.status(400).json({
          erro: true,
          mensagem: 'Dados inválidos',
          detalhes: resultado.error.issues
        });
      }

      const configuracoes = await NotificationModel.atualizarConfiguracoes(
        usuarioId,
        resultado.data
      );

      return res.status(200).json({
        erro: false,
        mensagem: 'Configurações atualizadas com sucesso',
        configuracoes: {
          personalidade: configuracoes.personalidade,
          horario_inicio: configuracoes.horario_inicio,
          horario_fim: configuracoes.horario_fim,
          frequencia_maxima: configuracoes.frequencia_maxima,
          tipos_habilitados: configuracoes.tipos_habilitados,
          timezone: configuracoes.timezone
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processa fila de notificações (endpoint administrativo)
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async processarFila(req, res) {
    try {
      const processedNotifications = await this.queueManager.processQueue();

      return res.status(200).json({
        erro: false,
        mensagem: `${processedNotifications.length} notificações processadas`,
        processed: processedNotifications.map(n => ({
          id: n.id,
          usuario: n.usuario?.nome,
          tipo: n.tipo,
          titulo: n.titulo,
          enviado_em: n.enviado_em
        }))
      });
    } catch (error) {
      console.error('Erro ao processar fila:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas do NeuroLink
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async obterEstatisticas(req, res) {
    try {
      const usuarioId = req.usuario.id;

      // Buscar notificações dos últimos 30 dias
      const notifications = await NotificationModel.listarPorUsuario(usuarioId, { limite: 1000 });
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentNotifications = notifications.filter(
        n => new Date(n.criado_em) >= thirtyDaysAgo
      );

      const stats = {
        total_notifications: recentNotifications.length,
        sent_notifications: recentNotifications.filter(n => n.status === 'SENT').length,
        read_notifications: recentNotifications.filter(n => n.status === 'read').length,
        read_rate: 0,
        types_breakdown: {},
        priority_breakdown: {},
        engagement_score: 0
      };

      // Calcular taxa de leitura
      if (stats.sent_notifications > 0) {
        stats.read_rate = (stats.read_notifications / stats.sent_notifications * 100).toFixed(1);
      }

      // Breakdown por tipo
      recentNotifications.forEach(n => {
        stats.types_breakdown[n.tipo] = (stats.types_breakdown[n.tipo] || 0) + 1;
      });

      // Breakdown por prioridade
      recentNotifications.forEach(n => {
        const priority = `P${n.prioridade}`;
        stats.priority_breakdown[priority] = (stats.priority_breakdown[priority] || 0) + 1;
      });

      // Score de engajamento simplificado
      stats.engagement_score = Math.min(100, (parseFloat(stats.read_rate) + 
        (stats.total_notifications > 0 ? 20 : 0))).toFixed(1);

      return res.status(200).json({
        erro: false,
        statistics: stats
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Testa conectividade com IA
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async testarIA(req, res) {
    try {
      const isConnected = await this.aiEngine.testConnection();

      return res.status(200).json({
        erro: false,
        ia_conectada: isConnected,
        mensagem: isConnected ? 
          'IA conectada e funcionando' : 
          'Problemas de conectividade com IA'
      });
    } catch (error) {
      console.error('Erro ao testar IA:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro ao testar conectividade da IA'
      });
    }
  }

  /**
   * Agenda notificações para uma tarefa
   * @param {Object} req - Request
   * @param {Object} res - Response
   */
  async agendarNotificacoesTarefa(req, res) {
    try {
      const { tarefa_id, evento } = req.body;
      const usuarioId = req.usuario.id;

      // Validar evento
      const eventosValidos = ['TASK_CREATED', 'TASK_DEADLINE_APPROACHING', 'TASK_OVERDUE', 'TASK_COMPLETED'];
      if (!eventosValidos.includes(evento)) {
        return res.status(400).json({
          erro: true,
          mensagem: 'Evento inválido',
          eventos_validos: eventosValidos
        });
      }

      const notifications = await this.queueManager.scheduleTaskNotifications(
        tarefa_id,
        usuarioId,
        evento
      );

      return res.status(201).json({
        erro: false,
        mensagem: `${notifications.length} notificações agendadas para o evento ${evento}`,
        notifications: notifications.map(n => ({
          id: n.id,
          tipo: n.tipo,
          titulo: n.titulo,
          agendado_para: n.agendado_para
        }))
      });
    } catch (error) {
      console.error('Erro ao agendar notificações da tarefa:', error);
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = NeuroLinkController;