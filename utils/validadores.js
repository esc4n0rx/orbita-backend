// Funções de validação 
const { z } = require('zod');

const registroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória')
});

const tarefaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  hora_vencimento: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora deve estar no formato HH:MM ou HH:MM:SS').optional().nullable(),
  pontos: z.number().int().min(1, 'Pontos deve ser pelo menos 1').max(20, 'Pontos não pode exceder 20')
});

const adiarTarefaSchema = z.object({
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  hora_vencimento: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora deve estar no formato HH:MM ou HH:MM:SS').optional().nullable()
});

module.exports = {
  registroSchema,
  loginSchema,
  tarefaSchema,
  adiarTarefaSchema
};