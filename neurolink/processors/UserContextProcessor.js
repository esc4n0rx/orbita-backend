
const UsuarioModel = require('../../models/usuarioModel');
const NotificationModel = require('../models/notificationModel');

class UserContextProcessor {
  /**
   * Processa e enriquece o contexto do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Contexto processado do usuário
   */
  async process(usuarioId) {
    try {
      // Buscar dados básicos do usuário
      const usuario = await UsuarioModel.buscarPorId(usuarioId);
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar contexto avançado
      const userContext = await NotificationModel.buscarContextoUsuario(usuarioId);
      
      // Calcular métricas de atividade
      const activityMetrics = await this._calculateActivityMetrics(usuarioId);
      
      // Determinar padrões de comportamento
      const behaviorPatterns = await this._analyzeBehaviorPatterns(usuarioId);
      
      // Calcular engagement com notificações
      const engagementScore = await this._calculateEngagementScore(usuarioId);

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel: usuario.nivel,
        pontos_xp: usuario.pontos_xp,
        sequencia: usuario.sequencia,
        criado_em: usuario.criado_em,
        
        // Contexto avançado
        activity_metrics: activityMetrics,
        behavior_patterns: behaviorPatterns,
        engagement_score: engagementScore,
        user_context: userContext,
        
        // Classificações derivadas
        user_segment: this._classifyUserSegment(usuario, activityMetrics),
        motivation_level: this._assessMotivationLevel(usuario, behaviorPatterns),
        optimal_notification_time: this._calculateOptimalTime(behaviorPatterns)
      };
    } catch (error) {
      console.error('Erro ao processar contexto do usuário:', error);
      
      // Retornar contexto mínimo em caso de erro
      const usuario = await UsuarioModel.buscarPorId(usuarioId);
      return {
        id: usuario?.id,
        nome: usuario?.nome || 'Usuário',
        nivel: usuario?.nivel || 1,
        pontos_xp: usuario?.pontos_xp || 0,
        sequencia: usuario?.sequencia || 0,
        user_segment: 'unknown',
        motivation_level: 'medium',
        engagement_score: 0.5
      };
    }
  }

  /**
   * Calcula métricas de atividade do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Métricas de atividade
   */
  async _calculateActivityMetrics(usuarioId) {
    try {
      const TarefaModel = require('../../models/tarefaModel');
      
      // Buscar tarefas dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const tarefas = await TarefaModel.listarTarefasPorUsuario(usuarioId);
      const recentTasks = tarefas.filter(t => new Date(t.data_criacao) >= thirtyDaysAgo);
      const completedTasks = recentTasks.filter(t => t.concluida);
      const overdueTasks = recentTasks.filter(t => t.vencida);
      
      return {
        total_tasks_30d: recentTasks.length,
        completed_tasks_30d: completedTasks.length,
        overdue_tasks_30d: overdueTasks.length,
        completion_rate: recentTasks.length > 0 ? completedTasks.length / recentTasks.length : 0,
        average_points_per_task: recentTasks.length > 0 ? 
          recentTasks.reduce((sum, t) => sum + t.pontos, 0) / recentTasks.length : 0,
        last_activity: recentTasks.length > 0 ? 
          Math.max(...recentTasks.map(t => new Date(t.data_criacao).getTime())) : null
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de atividade:', error);
      return {
        total_tasks_30d: 0,
        completed_tasks_30d: 0,
        overdue_tasks_30d: 0,
        completion_rate: 0,
        average_points_per_task: 0,
        last_activity: null
      };
    }
  }

  /**
   * Analisa padrões de comportamento do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Object>} - Padrões de comportamento
   */
  async _analyzeBehaviorPatterns(usuarioId) {
    try {
      const TarefaModel = require('../../models/tarefaModel');
      
      const tarefas = await TarefaModel.listarTarefasPorUsuario(usuarioId);
      const completedTasks = tarefas.filter(t => t.concluida && t.data_conclusao);
      
      if (completedTasks.length === 0) {
        return {
          preferred_hours: [],
          preferred_days: [],
          task_completion_patterns: 'insufficient_data',
          productivity_peak: 'unknown'
        };
      }
      
      // Analisar horários preferenciais
      const completionHours = completedTasks.map(t => new Date(t.data_conclusao).getHours());
      const hourFrequency = {};
      completionHours.forEach(hour => {
        hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
      });
      
      // Analisar dias preferenciais
      const completionDays = completedTasks.map(t => new Date(t.data_conclusao).getDay());
      const dayFrequency = {};
      completionDays.forEach(day => {
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;
      });
      
      // Encontrar picos de produtividade
      const topHours = Object.entries(hourFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));
        
      const topDays = Object.entries(dayFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => parseInt(day));
      
      return {
        preferred_hours: topHours,
        preferred_days: topDays,
        task_completion_patterns: this._identifyCompletionPattern(completedTasks),
        productivity_peak: this._identifyProductivityPeak(topHours),
        consistency_score: this._calculateConsistencyScore(completedTasks)
      };
    } catch (error) {
      console.error('Erro ao analisar padrões de comportamento:', error);
      return {
        preferred_hours: [],
        preferred_days: [],
        task_completion_patterns: 'error',
        productivity_peak: 'unknown',
        consistency_score: 0
      };
    }
  }

  /**
   * Calcula score de engajamento com notificações
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<number>} - Score de engajamento (0-1)
   */
  async _calculateEngagementScore(usuarioId) {
    try {
      // Buscar notificações dos últimos 30 dias
      const notifications = await NotificationModel.listarPorUsuario(usuarioId, { limite: 100 });
      
      if (notifications.length === 0) {
        return 0.5; // Score neutro para novos usuários
      }
      
      const sentNotifications = notifications.filter(n => n.status === 'SENT');
      const readNotifications = notifications.filter(n => n.status === 'read');
      
      // Calcular taxa de leitura
      const readRate = sentNotifications.length > 0 ? 
        readNotifications.length / sentNotifications.length : 0;
      
      // Buscar feedback positivo
      const feedbacks = await this._getUserFeedbacks(usuarioId);
      const positiveFeedbacks = feedbacks.filter(f => 
        ['helpful', 'perfect'].includes(f.feedback_tipo)
      );
      
      const feedbackScore = feedbacks.length > 0 ? 
        positiveFeedbacks.length / feedbacks.length : 0.5;
      
      // Score final (média ponderada)
      return (readRate * 0.7) + (feedbackScore * 0.3);
    } catch (error) {
      console.error('Erro ao calcular score de engajamento:', error);
      return 0.5;
    }
  }

  /**
   * Classifica o usuário em segmentos
   * @param {Object} usuario - Dados do usuário
   * @param {Object} activityMetrics - Métricas de atividade
   * @returns {string} - Segmento do usuário
   */
  _classifyUserSegment(usuario, activityMetrics) {
    const { nivel, sequencia } = usuario;
    const { completion_rate, total_tasks_30d } = activityMetrics;
    
    // Usuário novato
    if (nivel <= 2 && total_tasks_30d <= 5) {
      return 'beginner';
    }
    
    // Usuário ativo
    if (completion_rate >= 0.8 && total_tasks_30d >= 10) {
      return 'power_user';
    }
    
    // Usuário consistente
    if (sequencia >= 7 && completion_rate >= 0.6) {
      return 'consistent';
    }
    
    // Usuário em risco
    if (completion_rate < 0.4 || sequencia === 0) {
      return 'at_risk';
    }
    
    // Usuário casual
    return 'casual';
  }

  /**
   * Avalia nível de motivação do usuário
   * @param {Object} usuario - Dados do usuário
   * @param {Object} behaviorPatterns - Padrões de comportamento
   * @returns {string} - Nível de motivação
   */
  _assessMotivationLevel(usuario, behaviorPatterns) {
    const { sequencia, nivel } = usuario;
    const { consistency_score } = behaviorPatterns;
    
    if (sequencia >= 14 && consistency_score >= 0.7) {
      return 'high';
    }
    
    if (sequencia >= 7 && consistency_score >= 0.5) {
      return 'medium';
    }
    
    if (sequencia === 0 || consistency_score < 0.3) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Calcula horário ótimo para notificações
   * @param {Object} behaviorPatterns - Padrões de comportamento
   * @returns {string} - Horário ótimo (HH:MM)
   */
  _calculateOptimalTime(behaviorPatterns) {
    const { preferred_hours, productivity_peak } = behaviorPatterns;
    
    if (preferred_hours.length > 0) {
      const optimalHour = preferred_hours[0];
      return `${optimalHour.toString().padStart(2, '0')}:00`;
    }
    
    // Fallback baseado no pico de produtividade
    const defaultTimes = {
      morning: '09:00',
      afternoon: '14:00',
      evening: '19:00',
      unknown: '10:00'
    };
    
    return defaultTimes[productivity_peak] || defaultTimes.unknown;
  }

  /**
   * Identifica padrão de conclusão de tarefas
   * @param {Array} completedTasks - Tarefas concluídas
   * @returns {string} - Padrão identificado
   */
  _identifyCompletionPattern(completedTasks) {
    if (completedTasks.length < 5) {
      return 'insufficient_data';
    }
    
    // Analisar intervalos entre conclusões
    const intervals = [];
    for (let i = 1; i < completedTasks.length; i++) {
      const current = new Date(completedTasks[i].data_conclusao);
      const previous = new Date(completedTasks[i-1].data_conclusao);
      intervals.push(current - previous);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgDays = avgInterval / (1000 * 60 * 60 * 24);
    
    if (avgDays <= 1) return 'daily';
    if (avgDays <= 3) return 'frequent';
    if (avgDays <= 7) return 'weekly';
    return 'sporadic';
  }

  /**
   * Identifica pico de produtividade
   * @param {Array} topHours - Horários mais frequentes
   * @returns {string} - Período do pico
   */
  _identifyProductivityPeak(topHours) {
    if (topHours.length === 0) return 'unknown';
    
    const primaryHour = topHours[0];
    
    if (primaryHour >= 6 && primaryHour < 12) return 'morning';
    if (primaryHour >= 12 && primaryHour < 18) return 'afternoon';
    if (primaryHour >= 18 && primaryHour < 22) return 'evening';
    return 'night';
  }

  /**
   * Calcula score de consistência
   * @param {Array} completedTasks - Tarefas concluídas
   * @returns {number} - Score de consistência (0-1)
   */
  _calculateConsistencyScore(completedTasks) {
    if (completedTasks.length < 3) return 0;
    
    // Calcular variação nos intervalos de conclusão
    const intervals = [];
    for (let i = 1; i < completedTasks.length; i++) {
      const current = new Date(completedTasks[i].data_conclusao);
      const previous = new Date(completedTasks[i-1].data_conclusao);
      intervals.push(current - previous);
    }
    
    if (intervals.length === 0) return 0;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - mean, 2);
    }, 0) / intervals.length;
    
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Consistência inversamente proporcional à variação
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  /**
   * Busca feedbacks do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<Array>} - Lista de feedbacks
   */
  async _getUserFeedbacks(usuarioId) {
    try {
      const supabase = require('../../config/database');
      
      const { data, error } = await supabase
        .from('orbita_notification_feedback')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Erro ao buscar feedbacks:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar feedbacks do usuário:', error);
      return [];
    }
  }
}
module.exports = { UserContextProcessor };
