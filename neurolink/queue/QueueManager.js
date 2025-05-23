const NotificationModel = require('../models/notificationModel');
const PriorityCalculator = require('./PriorityCalculator');
const AIEngine = require('../core/AIEngine');
const { UserContextProcessor } = require('../processors/UserContextProcessor');
const { TaskContextProcessor } = require('../processors/TaskContextProcessor');
const PushNotificationService = require('../services/pushNotificationService');

class QueueManager {
  constructor() {
    this.aiEngine = new AIEngine();
    this.userContextProcessor = new UserContextProcessor();
    this.taskContextProcessor = new TaskContextProcessor();
    this.priorityCalculator = new PriorityCalculator();
    this.pushService = new PushNotificationService();
    this.isProcessing = false;
    this.batchSize = 10; // Define um tamanho de lote para processamento
  }

  /**
   * Adiciona uma notificação à fila
   * @param {Object} notificationData - Dados da notificação
   * @returns {Promise<Object|null>} - Notificação criada ou null se não puder ser enviada/duplicada
   */
  async enqueue(notificationData) {
    try {
      // Processar contexto completo
      const context = await this._buildFullContext(notificationData);

      // Calcular prioridade
      const prioridade = await this.priorityCalculator.calculate(context);

      // Determinar melhor horário de envio
      const agendadoPara = await this._calculateOptimalTime(context, notificationData.delay);

      // Verificar se não excede limite diário
      const podeEnviar = await this._checkDailyLimit(notificationData.usuario_id);
      if (!podeEnviar) {
        console.log(`Limite diário atingido para usuário ${notificationData.usuario_id}. Notificação não adicionada.`);
        return null;
      }

      // Verificar duplicatas
      const isDuplicate = await this._checkDuplicates(notificationData);
      if (isDuplicate) {
        console.log('Notificação duplicada ignorada:', notificationData);
        return null;
      }

      // Gerar conteúdo com IA
      let notificationContent;
      try {
        const aiResult = await this.aiEngine.generateNotification(context);
        if (aiResult && aiResult.success && aiResult.data) {
          notificationContent = aiResult.data;
        } else {
          console.warn('Falha na IA ou resultado inválido, usando fallback:', aiResult ? aiResult.fallback : 'Resultado da IA nulo/inválido');
          notificationContent = this._generateFallback(context);
        }
      } catch (error) {
        console.warn(`Falha na IA ao gerar notificação (usuário: ${notificationData.usuario_id}, tipo: ${notificationData.tipo}): ${error.message}. Usando fallback.`);
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
        status: 'PENDING', // Status inicial
        metadata: {
          tom: notificationContent.tom,
          emoji_principal: notificationContent.emoji_principal,
          context_snapshot: context, // Pode ser útil para debugging
          generated_with_ai: !!(notificationContent.titulo && notificationContent.mensagem) // Verifica se o conteúdo principal foi gerado
        }
      });

      console.log(`Notificação ${notification.id} (tipo: ${notification.tipo}) adicionada à fila para usuário ${notification.usuario_id} para ${agendadoPara}`);
      return notification;

    } catch (error) {
      console.error(`Erro ao adicionar notificação à fila (usuário: ${notificationData.usuario_id}, tipo: ${notificationData.tipo}):`, error);
      // Considerar se deve propagar o erro ou retornar um valor específico
      // throw error; // Propaga o erro, pode parar o chamador
      return null; // Ou retorna null para indicar falha sem parar o fluxo
    }
  }

  /**
   * Processa a fila de notificações
   * @returns {Promise<Array>} - Notificações processadas
   */
  async processQueue() {
    if (this.isProcessing) {
      console.log('Fila já está sendo processada. Tentativa ignorada.');
      return [];
    }

    this.isProcessing = true;
    console.log('Iniciando processamento da fila...');

    try {
      // Buscar notificações pendentes e prontas para envio (agendado_para <= agora)
      const pendingNotifications = await NotificationModel.listarPendentesParaEnvio(this.batchSize);

      if (pendingNotifications.length === 0) {
        console.log('Nenhuma notificação pendente para processar no momento.');
        return [];
      }

      console.log(`Processando ${pendingNotifications.length} notificações.`);

      const processedNotifications = [];

      for (const notification of pendingNotifications) {
        try {
          // Verificar se ainda está no horário permitido do usuário (última checagem)
          const isAllowedTime = await this._isWithinAllowedHours(notification.usuario_id);

          if (!isAllowedTime) {
            console.log(`Notificação ${notification.id} fora do horário permitido para usuário ${notification.usuario_id}. Reagendando.`);
            await this._rescheduleNotification(notification);
            continue;
          }

          // Marcar como enviando para evitar processamento duplicado em execuções paralelas (se houver)
          // await NotificationModel.atualizarStatus(notification.id, 'SENDING');

          const pushResult = await this.pushService.enviarParaUsuario(
            notification.usuario_id,
            {
              id: notification.id,
              titulo: notification.titulo,
              mensagem: notification.mensagem,
              tipo: notification.tipo,
              tarefa_id: notification.tarefa_id,
              prioridade: notification.prioridade,
              url: this._gerarUrlNotificacao(notification)
              // Adicionar outros dados relevantes para o payload do push, se necessário
            }
          );

          // Marcar como enviada
          const sentNotification = await NotificationModel.atualizarStatus(
            notification.id,
            'SENT',
            { enviado_em: new Date().toISOString(), push_service_response: pushResult }
          );

          console.log(`📱 Notificação ${notification.id} enviada para usuário ${notification.usuario_id}. Resultado:`, pushResult);
          processedNotifications.push({
            ...sentNotification,
            // Considerar se 'usuario' e 'tarefa' precisam ser populados aqui
            // Se NotificationModel já retorna esses dados, não é necessário.
            // usuario: notification.usuario, // Exemplo, se necessário
            // tarefa: notification.tarefa    // Exemplo, se necessário
          });

        } catch (error) {
          console.error(`Erro ao processar notificação ${notification.id} para usuário ${notification.usuario_id}:`, error);

          const retryCount = (notification.metadata?.retry_count || 0) + 1;
          let newStatus = 'PENDING'; // Tenta reenviar
          // Poderia adicionar lógica para mover para 'FAILED' após X tentativas
          if (retryCount > 5) { // Exemplo: máximo de 5 tentativas
             newStatus = 'FAILED';
             console.warn(`Notificação ${notification.id} excedeu o limite de tentativas. Marcada como FAILED.`);
          }


          await NotificationModel.atualizarStatus(
            notification.id,
            newStatus,
            {
              metadata: {
                ...notification.metadata,
                retry_count: retryCount,
                last_error: error.message,
                last_attempt_timestamp: new Date().toISOString()
              }
            }
          );
        }
      }
      return processedNotifications;

    } catch (error) {
      console.error('Erro crítico no processamento da fila:', error);
      // Não propagar o erro para não parar o worker/job, mas logar criticamente
      return []; // Retorna array vazio em caso de erro geral no processamento
    } finally {
      this.isProcessing = false;
      console.log('Processamento da fila finalizado.');
    }
  }

  /**
   * Gera URL para a notificação
   * @param {Object} notification - Dados da notificação
   * @returns {string} - URL da notificação
   */
  _gerarUrlNotificacao(notification) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Idealmente, FRONTEND_URL vem de env vars

    if (notification.tarefa_id) {
      return `${baseUrl}/tarefas/${notification.tarefa_id}`;
    }

    switch (notification.tipo) {
      case 'ACHIEVEMENT':
        return `${baseUrl}/conquistas`;
      case 'PROGRESS_REPORT': // Exemplo de um tipo mais específico
        return `${baseUrl}/estatisticas/progresso`;
      case 'GENERAL_INFO':
      default:
        return `${baseUrl}/dashboard`;
    }
  }

  /**
   * Programa notificações baseadas em eventos de tarefa
   * @param {string} tarefaId - ID da tarefa
   * @param {string} usuarioId - ID do usuário
   * @param {string} evento - Tipo de evento (ex: 'TASK_CREATED', 'TASK_COMPLETED')
   * @returns {Promise<Array>} - Notificações criadas
   */
  async scheduleTaskNotifications(tarefaId, usuarioId, evento) {
    try {
      const notificationsToScheduleConfig = [];

      switch (evento) {
        case 'TASK_CREATED':
          notificationsToScheduleConfig.push({
            tipo: 'MOTIVATION',
            delayMinutes: 0, // Imediato (ou pequeno delay para confirmação)
            objective: 'Confirmar criação da tarefa e motivar início'
          });
          // AJUSTE: Await a chamada para _calculateReminderDelay
          const reminderDelayMinutes = await this._calculateReminderDelay(tarefaId, usuarioId);
          if (reminderDelayMinutes !== null && reminderDelayMinutes >=0) { // Apenas se o delay for válido
            notificationsToScheduleConfig.push({
              tipo: 'REMINDER',
              delayMinutes: reminderDelayMinutes,
              objective: 'Lembrar da tarefa próxima ao vencimento'
            });
          }
          break;

        case 'TASK_DEADLINE_APPROACHING': // Disparado por um scheduler externo
          notificationsToScheduleConfig.push({
            tipo: 'ALERT',
            delayMinutes: 0,
            objective: 'Alertar sobre prazo da tarefa se aproximando criticamente'
          });
          break;

        case 'TASK_OVERDUE': // Disparado por um scheduler externo
          notificationsToScheduleConfig.push({
            tipo: 'ALERT',
            delayMinutes: 0, // Imediato
            objective: 'Notificar tarefa vencida e sugerir ações'
          });
          break;

        case 'TASK_COMPLETED':
          notificationsToScheduleConfig.push({
            tipo: 'ACHIEVEMENT',
            delayMinutes: 0, // Imediato
            objective: 'Parabenizar pela conclusão e mostrar recompensas'
          });
          break;
        // Adicionar mais casos conforme necessário
        default:
          console.warn(`Evento de tarefa desconhecido: ${evento}`);
          return [];
      }

      const createdNotifications = [];
      for (const config of notificationsToScheduleConfig) {
        const notification = await this.enqueue({
          usuario_id: usuarioId,
          tarefa_id: tarefaId,
          tipo: config.tipo,
          objective: config.objective,
          delay: config.delayMinutes // Passando o delay em minutos
        });

        if (notification) {
          createdNotifications.push(notification);
        }
      }
      return createdNotifications;

    } catch (error) {
      console.error(`Erro ao agendar notificações para tarefa ${tarefaId} (evento: ${evento}):`, error);
      throw error; // Propagar para que o chamador saiba da falha
    }
  }

  /**
   * Constrói contexto completo para geração da notificação
   * @param {Object} notificationData - Dados da notificação (usuario_id, tarefa_id, tipo, objective, delay)
   * @returns {Promise<Object>} - Contexto completo
   */
  async _buildFullContext(notificationData) {
    try {
      const userContext = await this.userContextProcessor.process(notificationData.usuario_id);
      if (!userContext) {
        throw new Error(`Contexto do usuário ${notificationData.usuario_id} não encontrado.`);
      }

      let taskContext = null;
      if (notificationData.tarefa_id) {
        taskContext = await this.taskContextProcessor.process(notificationData.tarefa_id);
        // Não lançar erro se a tarefa não for encontrada, pois a notificação pode não depender dela
      }

      // Buscar configurações de notificação do usuário
      const userSettings = await NotificationModel.buscarConfiguracoes(notificationData.usuario_id);
      if (!userSettings) {
         // Usar configurações padrão se não encontradas, ou lançar erro se forem críticas
        console.warn(`Configurações de notificação não encontradas para usuário ${notificationData.usuario_id}. Usando padrões.`);
        // userSettings = { horario_inicio: '09:00', horario_fim: '21:00', frequencia_maxima: 10, ... }; // Exemplo
      }


      return {
        user: userContext,
        task: taskContext,
        settings: userSettings || {}, // Garante que settings seja um objeto
        notification: {
          type: notificationData.tipo,
          objective: notificationData.objective || 'Informar usuário sobre evento relevante.',
          requested_delay_minutes: notificationData.delay // O delay solicitado originalmente
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Erro ao construir contexto para notificação (usuário: ${notificationData.usuario_id}):`, error);
      throw error; // Propagar erro, pois o contexto é essencial
    }
  }

  /**
   * Calcula o melhor horário para enviar a notificação, considerando o delay opcional.
   * @param {Object} context - Contexto da notificação
   * @param {number} [delayMinutes=0] - Delay em minutos a partir de agora.
   * @returns {Promise<string>} - Timestamp ISO do agendamento
   */
  async _calculateOptimalTime(context, delayMinutes = 0) {
    const { settings, notification } = context;
    const now = new Date();
    let scheduledTime = new Date(now.getTime() + (delayMinutes * 60 * 1000));

    if (!settings || !settings.horario_inicio || !settings.horario_fim) {
      console.warn(`Usuário ${context.user?.id_usuario || 'desconhecido'} sem configurações de horário. Enviando com base no delay ou imediatamente.`);
      return scheduledTime.toISOString();
    }

    // Se o tipo for ALERTA, tentar enviar o mais rápido possível dentro da janela
    if (notification.type === 'ALERT') {
      if (this._isWithinHours(scheduledTime, settings.horario_inicio, settings.horario_fim)) {
        return scheduledTime.toISOString();
      }
      // Se fora da janela, agendar para o início da próxima janela
      const nextWindowStart = this._getNextTimeInWindow(now, settings.horario_inicio, settings.horario_fim, true);
      return nextWindowStart.toISOString();
    }

    // Para outros tipos, respeitar a janela de horários
    if (this._isWithinHours(scheduledTime, settings.horario_inicio, settings.horario_fim)) {
      return scheduledTime.toISOString();
    } else {
      // Se o horário calculado (com delay) cair fora, agendar para o início da próxima janela
      const nextWindowStartForDelayed = this._getNextTimeInWindow(scheduledTime, settings.horario_inicio, settings.horario_fim, false);
      return nextWindowStartForDelayed.toISOString();
    }
  }

  /**
   * Retorna o próximo horário válido dentro da janela do usuário,
   * começando a partir de 'baseDate'.
   * @param {Date} baseDate - Data base para cálculo.
   * @param {string} startTimeStr - Horário de início da janela (HH:MM).
   * @param {string} endTimeStr - Horário de fim da janela (HH:MM).
   * @param {boolean} forceNextDayIfBaseIsAfterWindow - Se true e baseDate.time > endTime, calcula para o próximo dia.
   * @returns {Date}
   */
  _getNextTimeInWindow(baseDate, startTimeStr, endTimeStr, forceNextDayIfBaseIsAfterWindow = false) {
    const [startHour, startMin] = startTimeStr.split(':').map(Number);
    const [endHour, endMin] = endTimeStr.split(':').map(Number);

    let nextOptimalDate = new Date(baseDate);

    // Horário atual em minutos do dia
    const baseTimeMinutes = nextOptimalDate.getHours() * 60 + nextOptimalDate.getMinutes();
    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;

    if (baseTimeMinutes < startTimeMinutes) { // Antes da janela no dia baseDate
      nextOptimalDate.setHours(startHour, startMin, 0, 0);
    } else if (baseTimeMinutes > endTimeMinutes || forceNextDayIfBaseIsAfterWindow) { // Depois da janela no dia baseDate ou forçado para o próximo dia
      nextOptimalDate.setDate(nextOptimalDate.getDate() + 1);
      nextOptimalDate.setHours(startHour, startMin, 0, 0);
    }
    // Se estiver dentro da janela (e não forçado para o próximo dia), o baseDate já é um candidato,
    // mas _calculateOptimalTime já trata isso, aqui garantimos que seja o início da janela se cair fora.

    return nextOptimalDate;
  }


  /**
   * Verifica se não excede o limite diário de notificações
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<boolean>} - Se pode enviar
   */
  async _checkDailyLimit(usuarioId) {
    try {
      const settings = await NotificationModel.buscarConfiguracoes(usuarioId);
      if (!settings || typeof settings.frequencia_maxima !== 'number') {
        console.warn(`Configurações de frequência não encontradas ou inválidas para usuário ${usuarioId}. Permitindo envio.`);
        return true; // Default para permitir se não configurado
      }
      if (settings.frequencia_maxima <= 0) return false; // Se limite é 0 ou negativo, não envia

      // AJUSTE: Corrigido possível erro de digitação (Notificacies -> Notificacoes)
      const countToday = await NotificationModel.contarNotificacoesHoje(usuarioId);

      return countToday < settings.frequencia_maxima;
    } catch (error) {
      console.error(`Erro ao verificar limite diário para usuário ${usuarioId}:`, error);
      return true; // Em caso de erro na verificação, permitir envio para não bloquear indevidamente
    }
  }

  /**
   * Verifica se é uma notificação duplicada (mesmo tipo, mesma tarefa, dentro de um período recente)
   * @param {Object} notificationData - Dados da notificação (usuario_id, tarefa_id, tipo)
   * @returns {Promise<boolean>} - Se é duplicada
   */
  async _checkDuplicates(notificationData) {
    try {
      if (!notificationData.tarefa_id) { // Não checar duplicatas para notificações sem tarefa associada (ou refinar critério)
        return false;
      }
      const XMinutesAgo = new Date();
      XMinutesAgo.setMinutes(XMinutesAgo.getMinutes() - 120); // Janela de 2 horas para duplicatas

      const recentNotifications = await NotificationModel.listarRecentesPorUsuarioETipo(
        notificationData.usuario_id,
        notificationData.tipo,
        XMinutesAgo.toISOString(),
        10 // Limite de busca
      );

      return recentNotifications.some(notification =>
        notification.tarefa_id === notificationData.tarefa_id
        // Poderia adicionar verificação de status (ex: não considerar 'FAILED' como duplicata para nova tentativa)
      );

    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return false; // Em caso de erro, não bloquear envio
    }
  }

  /**
   * Gera notificação de fallback caso a IA falhe
   * @param {Object} context - Contexto da notificação
   * @returns {Object} - Notificação de fallback (titulo, mensagem, tom, emoji_principal)
   */
  _generateFallback(context) {
    const { user, task, notification } = context;
    const userName = user?.nome_preferido || user?.nome_completo || 'Usuário';
    const taskName = task?.titulo || task?.nome || 'sua tarefa';

    const fallbacks = {
      ALERT: {
        titulo: `⚠️ Atenção, ${userName}!`,
        mensagem: `Há uma atualização importante sobre ${taskName}. Verifique os detalhes.`,
        tom: 'urgent',
        emoji_principal: '⚠️'
      },
      REMINDER: {
        titulo: `📝 Lembrete, ${userName}`,
        mensagem: `Não se esqueça de ${taskName}. Você consegue!`,
        tom: 'friendly',
        emoji_principal: '📝'
      },
      MOTIVATION: {
        titulo: `🚀 Continue assim, ${userName}!`,
        mensagem: `Você está progredindo muito bem! Lembre-se dos seus objetivos.`,
        tom: 'motivational',
        emoji_principal: '🚀'
      },
      ACHIEVEMENT: {
        titulo: `🏆 Parabéns, ${userName}!`,
        mensagem: `Você concluiu ${taskName}! Ótimo trabalho! Recompensa: +${task?.pontos_recompensa || 0} pontos.`,
        tom: 'celebratory',
        emoji_principal: '🏆'
      },
      DEFAULT: {
        titulo: `🔔 Notificação Importante, ${userName}`,
        mensagem: `Temos uma nova informação para você. Confira!`,
        tom: 'neutral',
        emoji_principal: '🔔'
      }
    };

    return fallbacks[notification.type] || fallbacks.DEFAULT;
  }

  /**
   * Verifica se está dentro do horário permitido do usuário para envio de notificações.
   * @param {string} usuarioId - ID do usuário
   * @returns {Promise<boolean>} - Se está no horário permitido
   */
  async _isWithinAllowedHours(usuarioId) {
    try {
      const settings = await NotificationModel.buscarConfiguracoes(usuarioId);
      if (!settings || !settings.horario_inicio || !settings.horario_fim) {
        // Se não houver configuração, considera-se permitido para não bloquear
        console.warn(`Horários permitidos não configurados para usuário ${usuarioId}. Considerando permitido.`);
        return true;
      }
      const now = new Date();
      return this._isWithinHours(now, settings.horario_inicio, settings.horario_fim);
    } catch (error) {
      console.error(`Erro ao verificar horário permitido para usuário ${usuarioId}:`, error);
      return true; // Em caso de erro, permitir para não bloquear indevidamente
    }
  }

  /**
   * Verifica se o horário atual (now) está dentro do intervalo [inicio, fim].
   * @param {Date} now - Objeto Date representando o momento atual.
   * @param {string} inicioStr - Horário de início no formato "HH:MM".
   * @param {string} fimStr - Horário de fim no formato "HH:MM".
   * @returns {boolean} - True se estiver dentro do intervalo, false caso contrário.
   */
  _isWithinHours(now, inicioStr, fimStr) {
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = inicioStr.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMin;

    const [endHour, endMin] = fimStr.split(':').map(Number);
    const endTimeInMinutes = endHour * 60 + endMin;

    if (startTimeInMinutes <= endTimeInMinutes) {
      // Intervalo normal (ex: 09:00 - 18:00)
      return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
    } else {
      // Intervalo que atravessa a meia-noite (ex: 22:00 - 02:00)
      return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
    }
  }


  /**
   * Reagenda uma notificação para o próximo horário permitido.
   * @param {Object} notification - Notificação a ser reagendada
   * @returns {Promise<Object|null>} - Notificação atualizada ou null em caso de erro
   */
  async _rescheduleNotification(notification) {
    try {
      const settings = await NotificationModel.buscarConfiguracoes(notification.usuario_id);
      if (!settings || !settings.horario_inicio || !settings.horario_fim) {
        // Não é possível reagendar sem configurações, talvez marcar como erro ou tentar mais tarde?
        console.error(`Não foi possível reagendar notificação ${notification.id}: configurações de horário ausentes para usuário ${notification.usuario_id}.`);
        // Poderia atualizar para um status de erro específico aqui.
        return null;
      }

      const nextTime = this._getNextTimeInWindow(new Date(), settings.horario_inicio, settings.horario_fim, true);

      console.log(`Reagendando notificação ${notification.id} para ${nextTime.toISOString()}`);
      return await NotificationModel.atualizarStatus(
        notification.id,
        'PENDING', // Mantém pendente, mas com novo horário
        {
          agendado_para: nextTime.toISOString(),
          metadata: {
            ...notification.metadata,
            rescheduled_count: (notification.metadata?.rescheduled_count || 0) + 1,
            last_reschedule_reason: 'Fora do horário permitido'
          }
        }
      );
    } catch (error) {
      console.error(`Erro ao reagendar notificação ${notification.id}:`, error);
      // Considerar atualizar a notificação com um status de erro se o reagendamento falhar repetidamente.
      return null;
    }
  }

  /**
   * Calcula delay em minutos para lembrete baseado no vencimento da tarefa.
   * O lembrete é agendado para X horas antes do vencimento.
   * @param {string} tarefaId - ID da tarefa
   * @param {string} usuarioId - ID do usuário (para buscar contexto da tarefa se necessário)
   * @returns {Promise<number|null>} - Delay em minutos a partir de agora, ou null se não aplicável.
   */
  async _calculateReminderDelay(tarefaId, usuarioId) {
    try {
      // O taskContextProcessor deve ser capaz de buscar a tarefa apenas com o ID,
      // mas o usuarioId pode ser útil se a busca de tarefa for escopada por usuário.
      const task = await this.taskContextProcessor.process(tarefaId, usuarioId);

      if (!task || !task.data_vencimento) {
        console.warn(`Tarefa ${tarefaId} sem data de vencimento. Não é possível calcular delay do lembrete.`);
        return null; // Não há como calcular sem data de vencimento
      }

      const deadline = new Date(task.data_vencimento);
      const now = new Date();

      if (deadline <= now) {
        // Tarefa já vencida, não faz sentido agendar lembrete para antes do vencimento.
        // Poderia disparar uma notificação de 'TASK_OVERDUE' aqui ou deixar para outro fluxo.
        return null;
      }

      const diffMillis = deadline.getTime() - now.getTime();
      const diffHours = diffMillis / (1000 * 60 * 60);

      let reminderTimeBeforeDeadlineHours;

      if (diffHours <= 4) { // Muito próximo, lembrar 1 hora antes
        reminderTimeBeforeDeadlineHours = 1;
      } else if (diffHours <= 24) { // Menos de 1 dia, lembrar 2-4 horas antes (ex: 3 horas)
        reminderTimeBeforeDeadlineHours = 3;
      } else if (diffHours <= 72) { // Menos de 3 dias, lembrar 1 dia antes
        reminderTimeBeforeDeadlineHours = 24;
      } else { // Mais de 3 dias, lembrar 2 dias antes
        reminderTimeBeforeDeadlineHours = 48;
      }

      const reminderFromNowMillis = diffMillis - (reminderTimeBeforeDeadlineHours * 60 * 60 * 1000);

      if (reminderFromNowMillis <= 0) {
        // O momento calculado para o lembrete já passou ou é agora. Agendar para "agora" (delay 0).
        return 0;
      }

      return Math.round(reminderFromNowMillis / (1000 * 60)); // Delay em minutos

    } catch (error) {
      console.error(`Erro ao calcular delay do lembrete para tarefa ${tarefaId}:`, error);
      // Retornar um delay padrão ou null em caso de erro pode ser uma opção.
      // Se retornar null, a notificação de lembrete não será agendada por este método.
      return null;
    }
  }
}

module.exports = QueueManager;