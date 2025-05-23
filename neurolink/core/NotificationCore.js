class NotificationCore {
  constructor() {
    this.supportedTypes = ['ALERT', 'REMINDER', 'INSIGHT', 'MOTIVATION', 'PROGRESS', 'ACHIEVEMENT'];
    this.maxMessageLength = 280;
    this.maxTitleLength = 60;
  }

  /**
   * Valida estrutura da notificação
   * @param {Object} notification - Dados da notificação
   * @returns {Object} - Resultado da validação
   */
  validateNotification(notification) {
    const errors = [];

    // Validar tipo
    if (!notification.tipo || !this.supportedTypes.includes(notification.tipo)) {
      errors.push(`Tipo deve ser um dos: ${this.supportedTypes.join(', ')}`);
    }

    // Validar título
    if (!notification.titulo || notification.titulo.length === 0) {
      errors.push('Título é obrigatório');
    } else if (notification.titulo.length > this.maxTitleLength) {
      errors.push(`Título não pode exceder ${this.maxTitleLength} caracteres`);
    }

    // Validar mensagem
    if (!notification.mensagem || notification.mensagem.length === 0) {
      errors.push('Mensagem é obrigatória');
    } else if (notification.mensagem.length > this.maxMessageLength) {
      errors.push(`Mensagem não pode exceder ${this.maxMessageLength} caracteres`);
    }

    // Validar prioridade
    if (notification.prioridade && (notification.prioridade < 1 || notification.prioridade > 10)) {
      errors.push('Prioridade deve estar entre 1 e 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this._generateWarnings(notification)
    };
  }

  /**
   * Sanitiza conteúdo da notificação
   * @param {Object} notification - Notificação a ser sanitizada
   * @returns {Object} - Notificação sanitizada
   */
  sanitizeNotification(notification) {
    return {
      ...notification,
      titulo: this._sanitizeText(notification.titulo, this.maxTitleLength),
      mensagem: this._sanitizeText(notification.mensagem, this.maxMessageLength),
      prioridade: Math.max(1, Math.min(10, notification.prioridade || 5))
    };
  }

  /**
   * Gera warnings para a notificação
   * @param {Object} notification - Dados da notificação
   * @returns {Array} - Lista de warnings
   */
  _generateWarnings(notification) {
    const warnings = [];

    // Warning para títulos muito longos
    if (notification.titulo && notification.titulo.length > 40) {
      warnings.push('Título pode ser muito longo para alguns dispositivos');
    }

    // Warning para mensagens muito curtas
    if (notification.mensagem && notification.mensagem.length < 20) {
      warnings.push('Mensagem pode ser muito curta para ser informativa');
    }

    // Warning para prioridade muito alta sem justificativa
    if (notification.prioridade >= 9 && notification.tipo !== 'ALERT') {
      warnings.push('Prioridade muito alta para tipo de notificação não crítica');
    }

    return warnings;
  }

  /**
   * Sanitiza texto removendo caracteres perigosos
   * @param {string} text - Texto a ser sanitizado
   * @param {number} maxLength - Comprimento máximo
   * @returns {string} - Texto sanitizado
   */
  _sanitizeText(text, maxLength) {
    if (!text) return '';
    
    // Remover caracteres de controle e quebras de linha extras
    let sanitized = text
      .replace(/[\x00-\x1F\x7F]/g, '') // Caracteres de controle
      .replace(/\s+/g, ' ') // Múltiplos espaços em um só
      .trim();

    // Truncar se necessário
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength - 3) + '...';
    }

    return sanitized;
  }

  /**
   * Determina emoji baseado no tipo e contexto
   * @param {string} type - Tipo da notificação
   * @param {Object} context - Contexto adicional
   * @returns {string} - Emoji apropriado
   */
  getAppropriateEmoji(type, context = {}) {
    const emojiMap = {
      'ALERT': ['⚠️', '🚨', '❗', '⏰'],
      'REMINDER': ['📝', '💡', '📌', '🔔'],
      'MOTIVATION': ['🚀', '💪', '🌟', '🔥'],
      'ACHIEVEMENT': ['🏆', '🎉', '✨', '👏'],
      'PROGRESS': ['📊', '📈', '⚡', '🎯'],
      'INSIGHT': ['💡', '🧠', '📋', '💭']
    };

    const emojis = emojiMap[type] || ['📝'];
    
    // Escolher emoji baseado no contexto
    if (context.urgency === 'high') return emojis[1] || emojis[0];
    if (context.positive === true) return emojis[2] || emojis[0];
    
    return emojis[0];
  }
}