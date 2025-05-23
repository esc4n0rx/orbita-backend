// neurolink/queue/QueueManager.js
const NotificationModel = require('../models/notificationModel');
const PriorityCalculator = require('./PriorityCalculator');
const AIEngine = require('../core/AIEngine');
const { UserContextProcessor } = require('../processors/UserContextProcessor');
const {TaskContextProcessor} = require('../processors/TaskContextProcessor');

class QueueManager {
  constructor() {
    this.aiEngine = new AIEngine();
    this.userContextProcessor = new UserContextProcessor();
    this.taskContextProcessor = new TaskContextProcessor();
    this.priorityCalculator = new PriorityCalculator();
    this.isProcessing = false;
    this.batchSize = 10;
  }

  /**
   * Adiciona uma notificação à fila
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<Object>} - Notificação criada
   */
  async enqueue(notificationData) {
    try {
      // Processar contexto completo
      const context = await this._buildFullContext(notificationData);
      
      // Calcular prioridade
      const prioridade = await this.priorityCalculator.calculate(context);
      
      // Determinar melhor horário de envio
      const agendadoPara = await this._calculateOptimalTime(context);
      
      // Verificar se não excede limite diário
      const podeEnviar = await this._checkDailyLimit(notificationData.usuario_id);
      if (!podeEnviar) {
        console.log(`Limite diário atingido para usuário ${notificationData.usuario_id}`);
        return null;
      }
      
      // Verificar duplicatas
      const isDuplicate = await this._checkDuplicates(notificationData);
      if (isDuplicate) {
        console.log('Notificação duplicada ignorada');
        return null;
      }
      
      // Gerar conteúdo com IA
      let notificationContent;
      try {
        const aiResult = await this.aiEngine.generateNotification(context);
        notificationContent = aiResult.success ? aiResult.data : aiResult.fallback;
      } catch (error) {
        console.warn('Falha na IA, usando fallback:', error.message);
        notificationContent = this._generateFallback(context);
      }
      
      // Criar notificação na fila
      const notification = await NotificationModel.criarNotificacao({
        usuario_id: notificationData.usuario_id,
        tarefa_id: notificationData.tarefa_id,
        tipo: notificationData.tipo,
        titulo: notificationContent.titulo,
        mensagem: notificationContent.mensagem,
        prioridade,
        agendado_para: agendadoPara,
        metadata: {
          tom: notificationContent.tom,
          emoji_principal: notificationContent.emoji_principal,
          context_snapshot: context,
          generated_with_ai: !!notificationContent.titulo
        }
      });
      
      console.log(`Notificação ${notification.id} adicionada à fila`);
      return notification;
      
    } catch (error) {
      console.error('Erro ao adicionar notificação à fila:', error);
      throw error;
    }
  }

  /**
   * Processa a fila de notificações
   * @returns {Promise<Array>} - Notificações processadas
   */
  async processQueue() {
    if (this.isProcessing) {
      console.log('Fila já está sendo processada');
      return [];
    }

    this.isProcessing = true;
    
    try {
      // Buscar notificações pendentes
      const pendingNotifications = await NotificationModel.listarPendentes(this.batchSize);
      
      if (pendingNotifications.length === 0) {
        console.log('Nenhuma notificação pendente para processar');
        return [];
      }

      console.log(`Processando ${pendingNotifications.length} notificações`);
      
      const processedNotifications = [];
      
      for (const notification of pendingNotifications) {
        try {
          // Verificar se ainda está no horário permitido do usuário
          const isAllowedTime = await this._isWithinAllowedHours(notification.usuario_id);
          
          if (!isAllowedTime) {
            // Reagendar para próximo horário permitido
            await this._rescheduleNotification(notification);
            continue;
          }
          
          // Marcar como enviada
          const sentNotification = await NotificationModel.atualizarStatus(
            notification.id, 
            'SENT',
            { enviado_em: new Date().toISOString() }
          );
          
          processedNotifications.push({
            ...sentNotification,
            usuario: notification.usuario,
            tarefa: notification.tarefa
          });
          
        } catch (error) {
          console.error(`Erro ao processar notificação ${notification.id}:`, error);
          
          // Marcar como erro para retry posterior
          await NotificationModel.atualizarStatus(
            notification.id,
            'PENDING',
            { 
              metadata: { 
                ...notification.metadata, 
                retry_count: (notification.metadata?.retry_count || 0) + 1,
                last_error: error.message
              }
            }
          );
        }
      }
      
      return processedNotifications;
      
    } catch (error) {
      console.error('Erro no processamento da fila:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Programa notificações baseadas em eventos de tarefa
   * @param {string} tarefaId - ID da tarefa
   * @param {string} usuarioId - ID do usuário
   * @param {string} evento - Tipo de evento
   * @returns {Promise<Array>} - Notificações criadas
   */
  async scheduleTaskNotifications(tarefaId, usuarioId, evento) {
    try {
      const notificationsToSchedule = [];
      
      switch (evento) {
        case 'TASK_CREATED':
          // Notificação de confirmação
          notificationsToSchedule.push({
            tipo: 'MOTIVATION',
            delay: 0, // Imediato
            objective: 'Confirmar criação da tarefa e motivar'
          });
          
          // Lembrete antes do vencimento
          notificationsToSchedule.push({
            tipo: 'REMINDER',
            delay: this._calculateReminderDelay(tarefaId),
            objective: 'Lembrar da tarefa próxima ao vencimento'
          });
          break;
          
        case 'TASK_DEADLINE_APPROACHING':
          notificationsToSchedule.push({
            tipo: 'ALERT',
            delay: 0,
            objective: 'Alertar sobre prazo próximo'
          });
          break;
          
        case 'TASK_OVERDUE':
          notificationsToSchedule.push({
            tipo: 'ALERT',
            delay: 0,
            objective: 'Notificar tarefa vencida'
          });
          break;
          
        case 'TASK_COMPLETED':
          notificationsToSchedule.push({
            tipo: 'ACHIEVEMENT',
            delay: 0,
            objective: 'Parabenizar pela conclusão'
          });
          break;
      }
      
      const createdNotifications = [];
      
      for (const notificationData of notificationsToSchedule) {
        const notification = await this.enqueue({
          usuario_id: usuarioId,
          tarefa_id: tarefaId,
          tipo: notificationData.tipo,
          objective: notificationData.objective,
          delay: notificationData.delay
        });
        
        if (notification) {
          createdNotifications.push(notification);
        }
      }
      
      return createdNotifications;
      
    } catch (error) {
      console.error('Erro ao agendar notificações da tarefa:', error);
      throw error;
    }
  }

  /**
   * Constrói contexto completo para geração da notificação
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<Object>} - Contexto completo
   */
  async _buildFullContext(notificationData) {
    try {
      // Buscar dados do usuário
      const userContext = await this.userContextProcessor.process(notificationData.usuario_id);
      
      // Buscar dados da tarefa (se aplicável)
      let taskContext = null;
      if (notificationData.tarefa_id) {
        taskContext = await this.taskContextProcessor.process(notificationData.tarefa_id);
      }
      
      // Buscar configurações de notificação
      const settings = await NotificationModel.buscarConfiguracoes(notificationData.usuario_id);
      
      return {
        type: notificationData.tipo,
        objective: notificationData.objective || 'Informar usuário',
        user: userContext,
        task: taskContext,
        settings,
        notification: {
          type: notificationData.tipo,
          objective: notificationData.objective
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro ao construir contexto:', error);
      throw error;
    }
  }

  /**
   * Calcula o melhor horário para enviar a notificação
   * @param {Object} context - Contexto da notificação
   * @returns {Promise<string>} - Timestamp do agendamento
   */
  async _calculateOptimalTime(context) {
    const now = new Date();
    const { settings, notification } = context;
    
    // Para alertas urgentes, enviar imediatamente se dentro do horário
    if (notification.type === 'ALERT') {
      if (this._isWithinHours(now, settings.horario_inicio, settings.horario_fim)) {
        return now.toISOString();
      }
    }
    
    // Para outros tipos, calcular próximo horário ótimo
    const nextOptimalTime = this._getNextOptimalTime(settings);
    return nextOptimalTime.toISOString();
  }

  /**
   * Verifica se não excede o limite diário de notificações
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<boolean>} - Se pode enviar
   */
  async _checkDailyLimit(usuarioId) {
    try {
      const settings = await NotificationModel.buscarConfiguracoes(usuarioId);
      const countToday = await NotificationModel.contarNotificaciesHoje(usuarioId);
      
      return countToday < settings.frequencia_maxima;
    } catch (error) {
      console.error('Erro ao verificar limite diário:', error);
      return true; // Em caso de erro, permitir envio
    }
  }

  /**
   * Verifica se é uma notificação duplicada
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<boolean>} - Se é duplicada
   */
  async _checkDuplicates(notificationData) {
    try {
      // Buscar notificações similares nas últimas 2 horas
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const recentNotifications = await NotificationModel.listarPorUsuario(
        notificationData.usuario_id,
        { 
          status: 'SENT',
          limite: 10
        }
      );
      
      return recentNotifications.some(notification => 
        notification.tarefa_id === notificationData.tarefa_id &&
        notification.tipo === notificationData.tipo &&
        new Date(notification.enviado_em) > twoHoursAgo
      );
      
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return false;
    }
  }

  /**
   * Gera notificação de fallback
   * @param {Object} context - Contexto da notificação
   * @returns {Object} - Notificação de fallback
   */
  _generateFallback(context) {
    const { user, task, notification } = context;
    
    const fallbacks = {
      ALERT: {
        titulo: `⚠️ ${user.nome}, atenção!`,
        mensagem: `Sua tarefa "${task?.nome || 'pendente'}" precisa da sua atenção.`,
        tom: 'urgent',
        emoji_principal: '⚠️'
      },
      REMINDER: {
        titulo: `📝 Lembrete, ${user.nome}`,
        mensagem: `Não esqueça da sua tarefa "${task?.nome || 'pendente'}".`,
        tom: 'friendly',
        emoji_principal: '📝'
      },
      MOTIVATION: {
        titulo: `🚀 Continue assim, ${user.nome}!`,
        mensagem: `Você está indo bem! Nível ${user.nivel}, ${user.sequencia} dias de sequência.`,
        tom: 'motivational',
        emoji_principal: '🚀'
      },
      ACHIEVEMENT: {
        titulo: `🏆 Parabéns, ${user.nome}!`,
        mensagem: `Tarefa concluída! +${task?.pontos || 0} pontos para você.`,
        tom: 'celebratory',
        emoji_principal: '🏆'
      }
    };
    
    return fallbacks[notification.type] || fallbacks.REMINDER;
  }

  /**
   * Verifica se está dentro do horário permitido do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<boolean>} - Se está no horário permitido
   */
  async _isWithinAllowedHours(usuarioId) {
    try {
      const settings = await NotificationModel.buscarConfiguracoes(usuarioId);
      const now = new Date();
      
      return this._isWithinHours(now, settings.horario_inicio, settings.horario_fim);
    } catch (error) {
      console.error('Erro ao verificar horário permitido:', error);
      return true;
    }
  }

  /**
   * Verifica se o horário atual está dentro do intervalo permitido
   * @param {Date} now - Horário atual
   * @param {string} inicio - Horário de início (HH:MM)
   * @param {string} fim - Horário de fim (HH:MM)
   * @returns {boolean} - Se está dentro do intervalo
   */
  _isWithinHours(now, inicio, fim) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = inicio.split(':').map(Number);
    const [endHour, endMin] = fim.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Calcula o próximo horário ótimo para envio
   * @param {Object} settings - Configurações do usuário
   * @returns {Date} - Próximo horário ótimo
   */
  _getNextOptimalTime(settings) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [startHour, startMin] = settings.horario_inicio.split(':').map(Number);
    
    const nextTime = new Date(tomorrow);
    nextTime.setHours(startHour, startMin, 0, 0);
    
    return nextTime;
  }

  /**
   * Reagenda uma notificação para o próximo horário permitido
   * @param {Object} notification - Notificação a ser reagendada
   * @returns {Promise<Object>} - Notificação reagendada
   */
  async _rescheduleNotification(notification) {
    try {
      const settings = await NotificationModel.buscarConfiguracoes(notification.usuario_id);
      const nextTime = this._getNextOptimalTime(settings);
      
      return await NotificationModel.atualizarStatus(
        notification.id,
        'PENDING',
        { agendado_para: nextTime.toISOString() }
      );
    } catch (error) {
      console.error('Erro ao reagendar notificação:', error);
      throw error;
    }
  }

  /**
   * Calcula delay para lembrete baseado no vencimento da tarefa
   * @param {string} tarefaId - ID da tarefa
   * @returns {number} - Delay em minutos
   */
  async _calculateReminderDelay(tarefaId) {
    try {
      const task = await this.taskContextProcessor.process(tarefaId);
      
      if (!task || !task.data_vencimento) {
        return 60; // 1 hora por padrão
      }
      
      const deadline = new Date(task.data_vencimento);
      const now = new Date();
      const diffHours = (deadline - now) / (1000 * 60 * 60);

      if (diffHours <= 24) {
        return Math.max(0, (diffHours - 2) * 60); 
      } else {
        return Math.max(0, (diffHours - 24) * 60);
      }
      
    } catch (error) {
      console.error('Erro ao calcular delay do lembrete:', error);
      return 60; 
    }
  }
}

module.exports = QueueManager;