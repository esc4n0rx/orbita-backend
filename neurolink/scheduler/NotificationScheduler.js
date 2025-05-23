const cron = require('node-cron');
const QueueManager = require('../queue/QueueManager');
const NotificationModel = require('../models/notificationModel');

class NotificationScheduler {
  constructor() {
    this.queueManager = new QueueManager();
    this.isRunning = false;
    this.jobs = new Map();
  }

  /**
   * Inicia o agendador de notificações
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler já está rodando');
      return;
    }

    console.log('🚀 Iniciando NeuroLink Scheduler...');

    // Processar fila a cada 2 minutos
    this.jobs.set('processQueue', cron.schedule('*/2 * * * *', async () => {
      try {
        const processed = await this.queueManager.processQueue();
        if (processed.length > 0) {
          console.log(`📤 ${processed.length} notificações enviadas`);
        }
      } catch (error) {
        console.error('Erro ao processar fila:', error);
      }
    }));

    // Verificar prazos próximos a cada hora
    this.jobs.set('checkDeadlines', cron.schedule('0 * * * *', async () => {
      try {
        const TarefaService = require('../../services/tarefaService');
        const count = await TarefaService.verificarPrazosProximos();
        if (count > 0) {
          console.log(`⏰ ${count} lembretes de prazo agendados`);
        }
      } catch (error) {
        console.error('Erro ao verificar prazos:', error);
      }
    }));

    // Verificar tarefas vencidas diariamente às 8h
    this.jobs.set('checkOverdue', cron.schedule('0 8 * * *', async () => {
      try {
        const TarefaService = require('../../services/tarefaService');
        const count = await TarefaService.verificarTarefasVencidas();
        if (count > 0) {
          console.log(`🚨 ${count} tarefas vencidas processadas`);
        }
      } catch (error) {
        console.error('Erro ao verificar tarefas vencidas:', error);
      }
    }));

    // Limpeza de notificações antigas semanalmente
    this.jobs.set('cleanup', cron.schedule('0 2 * * 0', async () => {
      try {
        await NotificationModel.limparNotificacoesAntigas(30);
        console.log('🧹 Limpeza de notificações antigas concluída');
      } catch (error) {
        console.error('Erro na limpeza:', error);
      }
    }));

    // Gerar insights semanais aos domingos às 10h
    this.jobs.set('weeklyInsights', cron.schedule('0 10 * * 0', async () => {
      try {
        await this._generateWeeklyInsights();
        console.log('📊 Insights semanais gerados');
      } catch (error) {
        console.error('Erro ao gerar insights:', error);
      }
    }));

    this.isRunning = true;
    console.log('✅ NeuroLink Scheduler iniciado com sucesso');
  }

  /**
   * Para o agendador
   */
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler não está rodando');
      return;
    }

    console.log('🛑 Parando NeuroLink Scheduler...');

    for (const [name, job] of this.jobs) {
      job.destroy();
      console.log(`⏹️ Job ${name} parado`);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ NeuroLink Scheduler parado');
  }

  /**
   * Gera insights semanais para usuários ativos
   */
  async _generateWeeklyInsights() {
    try {
      const supabase = require('../../config/database');
      
      // Buscar usuários ativos (que criaram tarefas na última semana)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: activeUsers } = await supabase
        .from('orbita_usuarios')
        .select(`
          id, nome,
          tarefas:orbita_tarefas(count)
        `)
        .gte('orbita_tarefas.data_criacao', weekAgo.toISOString());

      for (const user of activeUsers || []) {
        try {
          // Gerar insight personalizado
          await this.queueManager.enqueue({
            usuario_id: user.id,
            tipo: 'INSIGHT',
            objective: 'Fornecer insights semanais de produtividade'
          });
        } catch (error) {
          console.warn(`Erro ao gerar insight para usuário ${user.id}:`, error);
        }
      }

      return activeUsers?.length || 0;
    } catch (error) {
      console.error('Erro ao gerar insights semanais:', error);
      return 0;
    }
  }

  /**
   * Agenda notificação única
   * @param {Date} date - Data do agendamento
   * @param {Function} callback - Função a ser executada
   * @param {string} jobName - Nome do job
   */
  scheduleOnce(date, callback, jobName) {
    const cronExpression = this._dateToCron(date);
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        await callback();
        // Remover job após execução
        job.destroy();
        this.jobs.delete(jobName);
      } catch (error) {
        console.error(`Erro no job ${jobName}:`, error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`📅 Job ${jobName} agendado para ${date.toLocaleString()}`);
  }

  /**
   * Converte Date para expressão cron
   * @param {Date} date - Data
   * @returns {string} - Expressão cron
   */
  _dateToCron(date) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * Obtém status do agendador
   * @returns {Object} - Status atual
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      totalJobs: this.jobs.size,
      uptime: this.isRunning ? process.uptime() : 0
    };
  }
}
module.exports = NotificationScheduler;