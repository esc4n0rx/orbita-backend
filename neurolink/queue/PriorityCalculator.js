// neurolink/queue/PriorityCalculator.js
class PriorityCalculator {
  constructor() {
    // Pesos para diferentes fatores na priorização
    this.weights = {
      urgency: 0.4,        // Urgência da tarefa
      userLevel: 0.15,     // Nível do usuário
      taskPoints: 0.2,     // Pontos da tarefa
      notificationType: 0.15, // Tipo de notificação
      timeContext: 0.1     // Contexto temporal
    };
  }

  /**
   * Calcula a prioridade de uma notificação (1-10)
   * @param {Object} context - Contexto completo da notificação
   * @returns {Promise<number>} - Prioridade calculada
   */
  async calculate(context) {
    try {
      const scores = {
        urgency: this._calculateUrgencyScore(context),
        userLevel: this._calculateUserLevelScore(context),
        taskPoints: this._calculateTaskPointsScore(context),
        notificationType: this._calculateNotificationTypeScore(context),
        timeContext: this._calculateTimeContextScore(context)
      };

      // Calcular score ponderado
      let finalScore = 0;
      for (const [factor, score] of Object.entries(scores)) {
        finalScore += score * this.weights[factor];
      }

      // Normalizar para escala 1-10
      const priority = Math.max(1, Math.min(10, Math.round(finalScore)));
      
      console.log(`Prioridade calculada: ${priority}`, {
        scores,
        weights: this.weights,
        finalScore
      });

      return priority;
    } catch (error) {
      console.error('Erro ao calcular prioridade:', error);
      return 5; // Prioridade média como fallback
    }
  }

  /**
   * Calcula score baseado na urgência da tarefa
   * @param {Object} context - Contexto da notificação
   * @returns {number} - Score de urgência (0-10)
   */
  _calculateUrgencyScore(context) {
    const { task, notification } = context;

    // Para alertas, sempre alta prioridade
    if (notification.type === 'ALERT') {
      return 10;
    }

    // Se não há tarefa associada
    if (!task || !task.data_vencimento) {
      return 5;
    }

    try {
      const now = new Date();
      const deadline = new Date(task.data_vencimento);
      const timeDiff = deadline - now;
      const hoursUntilDeadline = timeDiff / (1000 * 60 * 60);

      // Já vencida
      if (hoursUntilDeadline < 0) {
        return 10;
      }

      // Menos de 2 horas
      if (hoursUntilDeadline < 2) {
        return 9;
      }

      // Menos de 6 horas
      if (hoursUntilDeadline < 6) {
        return 8;
      }

      // Menos de 24 horas
      if (hoursUntilDeadline < 24) {
        return 7;
      }

      // Menos de 48 horas
      if (hoursUntilDeadline < 48) {
        return 6;
      }

      // Menos de 1 semana
      if (hoursUntilDeadline < 168) {
        return 4;
      }

      // Mais de 1 semana
      return 2;
    } catch (error) {
      console.error('Erro ao calcular urgência:', error);
      return 5;
    }
  }

  /**
   * Calcula score baseado no nível do usuário
   * @param {Object} context - Contexto da notificação
   * @returns {number} - Score do nível (0-10)
   */
  _calculateUserLevelScore(context) {
    const { user } = context;

    if (!user || !user.nivel) {
      return 5;
    }

    // Usuários de nível mais alto recebem prioridade ligeiramente maior
    // para manter engajamento
    const levelScore = Math.min(10, user.nivel + 3);
    
    // Ajustar baseado na sequência atual
    const streakBonus = user.sequencia > 0 ? Math.min(2, user.sequencia / 5) : 0;
    
    return Math.min(10, levelScore + streakBonus);
  }

  /**
   * Calcula score baseado nos pontos da tarefa
   * @param {Object} context - Contexto da notificação
   * @returns {number} - Score dos pontos (0-10)
   */
  _calculateTaskPointsScore(context) {
    const { task } = context;

    if (!task || !task.pontos) {
      return 5;
    }

    // Tarefas com mais pontos recebem prioridade maior
    // Escala: 1-20 pontos -> 3-10 prioridade
    const pointsScore = Math.max(3, Math.min(10, (task.pontos / 20) * 7 + 3));
    
    return Math.round(pointsScore);
  }

  /**
   * Calcula score baseado no tipo de notificação
   * @param {Object} context - Contexto da notificação
   * @returns {number} - Score do tipo (0-10)
   */
  _calculateNotificationTypeScore(context) {
    const { notification } = context;

    const typeScores = {
      'ALERT': 10,        // Máxima prioridade
      'REMINDER': 7,      // Alta prioridade
      'MOTIVATION': 5,    // Prioridade média
      'ACHIEVEMENT': 8,   // Alta prioridade (reforço positivo)
      'PROGRESS': 4,      // Prioridade baixa-média
      'INSIGHT': 3        // Prioridade baixa
    };

    return typeScores[notification.type] || 5;
  }

  /**
   * Calcula score baseado no contexto temporal
   * @param {Object} context - Contexto da notificação
   * @returns {number} - Score temporal (0-10)
   */
  _calculateTimeContextScore(context) {
    const { user, settings } = context;
    const now = new Date();
    const currentHour = now.getHours();

    try {
      // Verificar se está no horário ativo do usuário
      const [startHour] = settings.horario_inicio.split(':').map(Number);
      const [endHour] = settings.horario_fim.split(':').map(Number);

      // Fora do horário ativo = prioridade baixa
      if (currentHour < startHour || currentHour > endHour) {
        return 2;
      }

      // Horários prime time (manhã e início da noite)
      if ((currentHour >= 8 && currentHour <= 10) || 
          (currentHour >= 18 && currentHour <= 20)) {
        return 8;
      }

      // Horário comercial normal
      if (currentHour >= 9 && currentHour <= 17) {
        return 6;
      }

      // Outros horários dentro do permitido
      return 5;
    } catch (error) {
      console.error('Erro ao calcular score temporal:', error);
      return 5;
    }
  }

  /**
   * Ajusta prioridade baseada no histórico de engajamento
   * @param {string} usuarioId - ID do usuário
   * @param {number} basePriority - Prioridade base
   * @returns {Promise<number>} - Prioridade ajustada
   */
  async adjustForEngagement(usuarioId, basePriority) {
    try {
      // Buscar contexto do usuário para histórico de engajamento
      const NotificationModel = require('../models/notificationModel');
      const userContext = await NotificationModel.buscarContextoUsuario(usuarioId);
      
      if (!userContext || !userContext.historico_engajamento) {
        return basePriority;
      }

      const engagement = userContext.historico_engajamento;
      const avgEngagement = engagement.average_response_rate || 0.5;

      // Usuários com baixo engajamento recebem prioridade ligeiramente menor
      if (avgEngagement < 0.3) {
        return Math.max(1, basePriority - 1);
      }

      // Usuários com alto engajamento recebem prioridade ligeiramente maior
      if (avgEngagement > 0.7) {
        return Math.min(10, basePriority + 1);
      }

      return basePriority;
    } catch (error) {
      console.error('Erro ao ajustar prioridade por engajamento:', error);
      return basePriority;
    }
  }

  /**
   * Calcula prioridade dinâmica baseada na fila atual
   * @param {Array} queueNotifications - Notificações na fila
   * @param {Object} newNotification - Nova notificação
   * @returns {number} - Prioridade ajustada
   */
  calculateDynamicPriority(queueNotifications, newNotification) {
    try {
      // Contar notificações do mesmo usuário na fila
      const userNotificationsInQueue = queueNotifications.filter(
        n => n.usuario_id === newNotification.usuario_id
      ).length;

      // Se usuário já tem muitas notificações na fila, reduzir prioridade
      if (userNotificationsInQueue >= 3) {
        return Math.max(1, newNotification.prioridade - 2);
      }

      // Contar notificações do mesmo tipo
      const sameTypeCount = queueNotifications.filter(
        n => n.tipo === newNotification.tipo && 
             n.usuario_id === newNotification.usuario_id
      ).length;

      // Evitar spam do mesmo tipo
      if (sameTypeCount >= 2) {
        return Math.max(1, newNotification.prioridade - 1);
      }

      return newNotification.prioridade;
    } catch (error) {
      console.error('Erro ao calcular prioridade dinâmica:', error);
      return newNotification.prioridade;
    }
  }

  /**
   * Obtém estatísticas de priorização
   * @returns {Object} - Estatísticas dos pesos e configurações
   */
  getStats() {
    return {
      weights: this.weights,
      totalWeight: Object.values(this.weights).reduce((a, b) => a + b, 0),
      factors: Object.keys(this.weights),
      description: {
        urgency: 'Urgência baseada no prazo da tarefa',
        userLevel: 'Nível e sequência do usuário',
        taskPoints: 'Pontos da tarefa associada',
        notificationType: 'Tipo da notificação (ALERT, REMINDER, etc)',
        timeContext: 'Contexto temporal (horário ativo, prime time)'
      }
    };
  }

  /**
   * Atualiza pesos dos fatores de priorização
   * @param {Object} newWeights - Novos pesos
   * @returns {boolean} - Sucesso da atualização
   */
  updateWeights(newWeights) {
    try {
      // Validar que os pesos somam aproximadamente 1
      const totalWeight = Object.values(newWeights).reduce((a, b) => a + b, 0);
      
      if (Math.abs(totalWeight - 1) > 0.1) {
        throw new Error('Pesos devem somar aproximadamente 1.0');
      }

      // Validar que todos os fatores estão presentes
      const requiredFactors = Object.keys(this.weights);
      for (const factor of requiredFactors) {
        if (!(factor in newWeights)) {
          throw new Error(`Fator obrigatório ausente: ${factor}`);
        }
      }

      this.weights = { ...newWeights };
      console.log('Pesos de priorização atualizados:', this.weights);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar pesos:', error);
      return false;
    }
  }
}

module.exports = PriorityCalculator;