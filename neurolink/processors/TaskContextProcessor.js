// neurolink/processors/TaskContextProcessor.js
class TaskContextProcessor {
  /**
   * Processa e enriquece o contexto da tarefa
   * @param {string} tarefaId - ID da tarefa
   * @param {string} usuarioId - ID do usuário (opcional, para validação)
   * @returns {Promise<Object>} - Contexto processado da tarefa
   */
  async process(tarefaId, usuarioId = null) {
    try {
      const TarefaModel = require('../../models/tarefaModel');
      
      // Buscar dados básicos da tarefa
      const tarefa = await TarefaModel.buscarTarefaPorId(tarefaId);
      if (!tarefa) {
        console.warn(`Tarefa ${tarefaId} não encontrada`);
        return null;
      }

      // Verificar se pertence ao usuário (se usuarioId fornecido)
      if (usuarioId && tarefa.usuario_id !== usuarioId) {
        console.warn(`Tarefa ${tarefaId} não pertence ao usuário ${usuarioId}`);
        return null;
      }

      // Enriquecer com contexto adicional
      const enrichedContext = {
        ...tarefa,
        
        // Análise temporal
        time_analysis: await this._analyzeTimeContext(tarefa),
        
        // Classificação da tarefa
        task_classification: this._classifyTask(tarefa),
        
        // Urgência calculada
        urgency_level: this._calculateUrgencyLevel(tarefa),
        
        // Dificuldade estimada
        difficulty_estimate: this._estimateDifficulty(tarefa),
        
        // Contexto de categoria e tags
        categorization: await this._enrichCategorizationContext(tarefaId)
      };

      return enrichedContext;
    } catch (error) {
      console.error('Erro ao processar contexto da tarefa:', error);
      return null;
    }
  }

  /**
   * Analisa contexto temporal da tarefa
   * @param {Object} tarefa - Dados da tarefa
   * @returns {Object} - Análise temporal
   */
  async _analyzeTimeContext(tarefa) {
    try {
      const now = new Date();
      const created = new Date(tarefa.data_criacao);
      const deadline = new Date(tarefa.data_vencimento);
      
      // Adicionar hora se fornecida
      if (tarefa.hora_vencimento) {
        const [hours, minutes] = tarefa.hora_vencimento.split(':');
        deadline.setHours(parseInt(hours), parseInt(minutes));
      } else {
        deadline.setHours(23, 59, 59); // Fim do dia se não especificado
      }
      
      const timeToDeadline = deadline - now;
      const timeSinceCreated = now - created;
      const totalTimeAllowed = deadline - created;
      
      return {
        created_at: created.toISOString(),
        deadline_at: deadline.toISOString(),
        time_to_deadline_ms: timeToDeadline,
        time_to_deadline_hours: timeToDeadline / (1000 * 60 * 60),
        time_since_created_ms: timeSinceCreated,
        time_since_created_hours: timeSinceCreated / (1000 * 60 * 60),
        total_time_allowed_ms: totalTimeAllowed,
        progress_percentage: totalTimeAllowed > 0 ? (timeSinceCreated / totalTimeAllowed) * 100 : 0,
        is_overdue: timeToDeadline < 0,
        deadline_status: this._getDeadlineStatus(timeToDeadline)
      };
    } catch (error) {
      console.error('Erro na análise temporal:', error);
      return {};
    }
  }

  /**
   * Classifica a tarefa por características
   * @param {Object} tarefa - Dados da tarefa
   * @returns {Object} - Classificação da tarefa
   */
  _classifyTask(tarefa) {
    const classification = {
      point_category: this._categorizeByPoints(tarefa.pontos),
      complexity_level: this._assessComplexity(tarefa),
      priority_tier: this._assessPriorityTier(tarefa),
      task_type: this._identifyTaskType(tarefa.nome, tarefa.descricao)
    };
    
    return classification;
  }

  /**
   * Calcula nível de urgência da tarefa
   * @param {Object} tarefa - Dados da tarefa
   * @returns {string} - Nível de urgência
   */
  _calculateUrgencyLevel(tarefa) {
    try {
      const now = new Date();
      const deadline = new Date(tarefa.data_vencimento);
      const hoursToDeadline = (deadline - now) / (1000 * 60 * 60);
      
      if (hoursToDeadline < 0) return 'overdue';
      if (hoursToDeadline < 2) return 'critical';
      if (hoursToDeadline < 6) return 'high';
      if (hoursToDeadline < 24) return 'medium';
      if (hoursToDeadline < 72) return 'low';
      return 'minimal';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Estima dificuldade da tarefa
   * @param {Object} tarefa - Dados da tarefa
   * @returns {string} - Estimativa de dificuldade
   */
  _estimateDifficulty(tarefa) {
    // Basear na quantidade de pontos e complexidade da descrição
    const points = tarefa.pontos || 0;
    const descriptionLength = tarefa.descricao ? tarefa.descricao.length : 0;
    
    let difficultyScore = 0;
    
    // Pontuação por pontos
    if (points >= 15) difficultyScore += 3;
    else if (points >= 10) difficultyScore += 2;
    else if (points >= 5) difficultyScore += 1;
    
    // Pontuação por descrição
    if (descriptionLength > 200) difficultyScore += 2;
    else if (descriptionLength > 100) difficultyScore += 1;
    
    if (difficultyScore >= 4) return 'hard';
    if (difficultyScore >= 2) return 'medium';
    return 'easy';
  }

  /**
   * Enriquece contexto de categorização
   * @param {string} tarefaId - ID da tarefa
   * @returns {Promise<Object>} - Contexto de categorização
   */
  async _enrichCategorizationContext(tarefaId) {
    try {
      const CategoriaModel = require('../../models/categoriaModel');
      const TagModel = require('../../models/tagModel');
      
      const categorias = await CategoriaModel.listarCategoriasTarefa(tarefaId);
      const tags = await TagModel.listarTagsTarefa(tarefaId);
      
      return {
        categories: categorias.map(c => ({
          id: c.id,
          name: c.nome,
          color: c.cor,
          icon: c.icone,
          is_default: c.padrao
        })),
        tags: tags.map(t => ({
          id: t.id,
          name: t.nome,
          color: t.cor,
          is_default: t.padrao
        })),
        primary_category: categorias.length > 0 ? categorias[0].nome : 'uncategorized',
        category_context: this._deriveCategoryContext(categorias, tags)
      };
    } catch (error) {
      console.error('Erro ao enriquecer contexto de categorização:', error);
      return {
        categories: [],
        tags: [],
        primary_category: 'uncategorized',
        category_context: {}
      };
    }
  }

  /**
   * Obtém status do prazo
   * @param {number} timeToDeadline - Tempo até o prazo em ms
   * @returns {string} - Status do prazo
   */
  _getDeadlineStatus(timeToDeadline) {
    const hours = timeToDeadline / (1000 * 60 * 60);
    
    if (hours < 0) return 'overdue';
    if (hours < 1) return 'imminent';
    if (hours < 6) return 'urgent';
    if (hours < 24) return 'approaching';
    if (hours < 72) return 'upcoming';
    return 'distant';
  }

  /**
   * Categoriza por pontos
   * @param {number} pontos - Pontos da tarefa
   * @returns {string} - Categoria de pontos
   */
  _categorizeByPoints(pontos) {
    if (pontos >= 15) return 'high_value';
    if (pontos >= 10) return 'medium_value';
    if (pontos >= 5) return 'standard_value';
    return 'low_value';
  }

  /**
   * Avalia complexidade
   * @param {Object} tarefa - Dados da tarefa
   * @returns {string} - Nível de complexidade
   */
  _assessComplexity(tarefa) {
    let complexity = 0;
    
    // Baseado na descrição
    if (tarefa.descricao && tarefa.descricao.length > 150) complexity++;
    if (tarefa.descricao && tarefa.descricao.includes('etapas')) complexity++;
    
    // Baseado nos pontos
    if (tarefa.pontos >= 12) complexity++;
    
    if (complexity >= 2) return 'complex';
    if (complexity === 1) return 'moderate';
    return 'simple';
  }

  /**
   * Avalia tier de prioridade
   * @param {Object} tarefa - Dados da tarefa
   * @returns {string} - Tier de prioridade
   */
  _assessPriorityTier(tarefa) {
    const urgency = this._calculateUrgencyLevel(tarefa);
    const points = tarefa.pontos || 0;
    
    if (urgency === 'critical' || points >= 18) return 'P0';
    if (urgency === 'high' || points >= 12) return 'P1';
    if (urgency === 'medium' || points >= 8) return 'P2';
    return 'P3';
  }

  /**
   * Identifica tipo da tarefa
   * @param {string} nome - Nome da tarefa
   * @param {string} descricao - Descrição da tarefa
   * @returns {string} - Tipo da tarefa
   */
  _identifyTaskType(nome, descricao) {
    const text = `${nome} ${descricao}`.toLowerCase();
    
    const patterns = {
      study: ['estudar', 'aprender', 'revisar', 'pesquisar', 'ler'],
      work: ['trabalho', 'projeto', 'reunião', 'apresentação', 'relatório'],
      personal: ['pessoal', 'casa', 'família', 'comprar', 'organizar'],
      health: ['exercício', 'médico', 'saúde', 'academia', 'treino'],
      creative: ['criar', 'desenhar', 'escrever', 'design', 'arte']
    };
    
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }
    
    return 'general';
  }

  /**
   * Deriva contexto de categoria
   * @param {Array} categorias - Categorias da tarefa
   * @param {Array} tags - Tags da tarefa
   * @returns {Object} - Contexto derivado
   */
  _deriveCategoryContext(categorias, tags) {
    const context = {
      has_work_context: false,
      has_personal_context: false,
      has_urgent_context: false,
      has_health_context: false,
      context_richness: 'low'
    };
    
    // Analisar categorias
    categorias.forEach(cat => {
      const name = cat.nome.toLowerCase();
      if (name.includes('trabalho')) context.has_work_context = true;
      if (name.includes('pessoal')) context.has_personal_context = true;
      if (name.includes('saúde')) context.has_health_context = true;
    });
    
    // Analisar tags
    tags.forEach(tag => {
      const name = tag.nome.toLowerCase();
      if (name.includes('urgent')) context.has_urgent_context = true;
    });
    
    // Determinar riqueza do contexto
    const contextCount = categorias.length + tags.length;
    if (contextCount >= 3) context.context_richness = 'high';
    else if (contextCount >= 1) context.context_richness = 'medium';
    
    return context;
  }
}

module.exports = TaskContextProcessor;