const axios = require('axios');
require('dotenv').config();

class AIEngine {
  constructor() {
    this.apiUrl = 'https://conductor.arcee.ai/v1/chat/completions';
    this.token = process.env.ARCEE_TOKEN;
    this.maxRetries = 3;
    this.timeout = 30000; // 30 segundos
  }

  /**
   * Gera uma notificação usando IA baseada no contexto fornecido
   * @param {Object} context - Contexto completo para geração
   * @returns {Promise<Object>} - Resposta da IA formatada
   */
  async generateNotification(context) {
    try {
      const prompt = this._buildPrompt(context);
      
      const response = await this._makeRequest(prompt);
      const parsedResponse = this._parseResponse(response);
      
      return {
        success: true,
        data: parsedResponse,
        metadata: {
          model: 'auto',
          context_type: context.type,
          user_id: context.user.id,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao gerar notificação com IA:', error);
      
      // Fallback para template estático em caso de erro
      return {
        success: false,
        error: error.message,
        fallback: this._generateFallbackNotification(context)
      };
    }
  }

  /**
   * Constrói o prompt contextualizado para a IA
   * @param {Object} context - Contexto da notificação
   * @returns {string} - Prompt formatado
   */
  _buildPrompt(context) {
    const { user, task, notification, settings } = context;
    
    const systemPrompt = `Você é o NeuroLink, um assistente inteligente de produtividade que gera notificações personalizadas e naturais.

REGRAS IMPORTANTES:
1. Seja ${settings.personalidade} no tom (formal/casual/motivational/friendly)
2. Use o nome do usuário: ${user.nome}
3. Seja conciso: máximo 280 caracteres para mensagem
4. Seja contextual e relevante
5. Use emojis apropriados mas com moderação
6. Considere o horário atual: ${new Date().toLocaleTimeString('pt-BR')}
7. Responda APENAS no formato JSON especificado

CONTEXTO DO USUÁRIO:
- Nome: ${user.nome}
- Nível: ${user.nivel}
- Sequência atual: ${user.sequencia} dias
- Personalidade preferida: ${settings.personalidade}
- Horário ativo: ${settings.horario_inicio} às ${settings.horario_fim}

CONTEXTO DA TAREFA:
- Nome: ${task?.nome || 'N/A'}
- Descrição: ${task?.descricao || 'N/A'}
- Pontos: ${task?.pontos || 0}
- Vencimento: ${task?.data_vencimento || 'N/A'}
- Status: ${task?.concluida ? 'Concluída' : 'Pendente'}

TIPO DE NOTIFICAÇÃO: ${notification.type}
OBJETIVO: ${notification.objective}

FORMATO DE RESPOSTA (JSON):
{
  "titulo": "Título da notificação (máx 60 chars)",
  "mensagem": "Mensagem principal (máx 280 chars)",
  "tom": "tom_detectado",
  "emoji_principal": "emoji_representativo"
}`;

    return systemPrompt;
  }

  /**
   * Faz a requisição para a API da Arcee
   * @param {string} prompt - Prompt para enviar
   * @returns {Promise<string>} - Resposta da IA
   */
  async _makeRequest(prompt) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: 'auto',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            },
            timeout: this.timeout
          }
        );

        return response.data.choices[0].message.content;
      } catch (error) {
        lastError = error;
        console.warn(`Tentativa ${attempt} falhou:`, error.message);
        
        if (attempt < this.maxRetries) {
          // Backoff exponencial
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Processa e valida a resposta da IA
   * @param {string} response - Resposta bruta da IA
   * @returns {Object} - Resposta formatada e validada
   */
  _parseResponse(response) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validar campos obrigatórios
      if (!parsed.titulo || !parsed.mensagem) {
        throw new Error('Resposta incompleta da IA');
      }
      
      // Truncar se necessário
      return {
        titulo: parsed.titulo.substring(0, 60),
        mensagem: parsed.mensagem.substring(0, 280),
        tom: parsed.tom || 'neutral',
        emoji_principal: parsed.emoji_principal || '📝'
      };
    } catch (error) {
      console.error('Erro ao processar resposta da IA:', error);
      throw new Error('Resposta inválida da IA');
    }
  }

  /**
   * Gera notificação de fallback quando a IA falha
   * @param {Object} context - Contexto da notificação
   * @returns {Object} - Notificação padrão
   */
  _generateFallbackNotification(context) {
    const { user, task, notification } = context;
    
    const fallbackTemplates = {
      ALERT: {
        titulo: `⚠️ Atenção, ${user.nome}!`,
        mensagem: `Sua tarefa "${task?.nome}" está próxima do vencimento. Não perca essa oportunidade!`,
        tom: 'urgent',
        emoji_principal: '⚠️'
      },
      REMINDER: {
        titulo: `📝 Lembrete para ${user.nome}`,
        mensagem: `Que tal dar uma olhada na sua tarefa "${task?.nome}"? Você consegue!`,
        tom: 'friendly',
        emoji_principal: '📝'
      },
      MOTIVATION: {
        titulo: `🚀 Vamos lá, ${user.nome}!`,
        mensagem: `Você está no nível ${user.nivel} com ${user.sequencia} dias de sequência. Continue assim!`,
        tom: 'motivational',
        emoji_principal: '🚀'
      }
    };
    
    return fallbackTemplates[notification.type] || fallbackTemplates.REMINDER;
  }

  /**
   * Testa a conectividade com a API
   * @returns {Promise<boolean>} - Status da conexão
   */
  async testConnection() {
    try {
      const response = await this._makeRequest('Teste de conexão. Responda apenas: {"status": "ok"}');
      return response.includes('ok');
    } catch (error) {
      return false;
    }
  }
}

module.exports = AIEngine;