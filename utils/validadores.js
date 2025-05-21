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
  pontos: z.number().int().min(1, 'Pontos deve ser pelo menos 1').max(20, 'Pontos não pode exceder 20'),
  categorias: z.array(z.string().uuid('IDs de categoria devem ser UUIDs válidos')).optional(),
  tags: z.array(z.string().uuid('IDs de tag devem ser UUIDs válidos')).optional()
});

const adiarTarefaSchema = z.object({
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  hora_vencimento: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora deve estar no formato HH:MM ou HH:MM:SS').optional().nullable()
});

const categoriaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve estar no formato hexadecimal válido (ex: #FF5733)').optional(),
  icone: z.string().optional()
});

const tagSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor deve estar no formato hexadecimal válido (ex: #FF5733)').optional()
});

const associarCategoriaSchema = z.object({
  categoria_id: z.string().uuid('ID da categoria deve ser um UUID válido')
});

const associarTagSchema = z.object({
  tag_id: z.string().uuid('ID da tag deve ser um UUID válido')
});

module.exports = {
  registroSchema,
  loginSchema,
  tarefaSchema,
  adiarTarefaSchema,
  categoriaSchema,
  tagSchema,
  associarCategoriaSchema,
  associarTagSchema
};