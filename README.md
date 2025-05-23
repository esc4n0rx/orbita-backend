# Routina - Sistema Inteligente para Gerenciamento da sua Rotina

<div align="center">
  <img src="https://i.ibb.co/27RfFhG1/logo.png" alt="Routina Logo" width="150">
  <h3>Organize suas tarefas. Evolua. Conquiste.</h3>
  
  **Agora com NeuroLink - Sistema Inteligente de Notificações com IA**
</div>

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [🧠 NeuroLink - Notificações Inteligentes](#-neurolink---notificações-inteligentes)
- [Recursos](#-recursos)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Uso da API](#-uso-da-api)
- [Documentação da API](#-documentação-da-api)
- [Modelos de Dados](#-modelos-de-dados)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🚀 Visão Geral

Routina é um sistema de gerenciamento de tarefas com gamificação, projetado para ajudar na organização diária de forma inteligente e motivadora. O sistema permite aos usuários criar, organizar e acompanhar suas tarefas, ganhar pontos de experiência (XP) ao concluí-las, subir de nível e manter sequências de produtividade.

## 🧠 NeuroLink - Notificações Inteligentes

### O que é o NeuroLink?

O **NeuroLink** é um sistema revolucionário de notificações inteligentes que utiliza IA generativa (Arcee AI) para criar mensagens personalizadas e contextuais. É mais que um sistema de notificações - é um assistente de produtividade que aprende e se adapta ao seu estilo.

### ✨ Principais Diferenciais

- **🤖 IA Generativa**: Primeira biblioteca de notificações com IA para gerar mensagens naturais
- **🎯 Contextual**: Analisa perfil do usuário, padrões de atividade e contexto da tarefa
- **🧠 Aprendizado**: Melhora continuamente com base no feedback dos usuários
- **⚡ Inteligente**: Sistema de filas com priorização dinâmica e prevenção de spam
- **🌟 Personalizado**: 4 personalidades diferentes (formal, casual, motivacional, amigável)
- **📊 Analytics**: Métricas avançadas de engajamento e efetividade

### 🎮 Tipos de Notificação

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| 🚨 **ALERT** | Urgências e vencimentos críticos | "⚠️ João, sua tarefa 'Apresentação cliente' vence em 2 horas!" |
| 📝 **REMINDER** | Lembretes contextuais e amigáveis | "💡 Oi João! Que tal dar uma olhada na tarefa 'Estudar Node.js'?" |
| 🚀 **MOTIVATION** | Impulsos motivacionais personalizados | "🔥 Incrível! 5 dias consecutivos de produtividade. Continue assim!" |
| 🏆 **ACHIEVEMENT** | Comemorações de conquistas | "🎉 Parabéns! Nível 3 desbloqueado. +15 pontos conquistados!" |
| 📊 **PROGRESS** | Atualizações de progresso | "📈 Você já completou 80% das tarefas desta semana!" |
| 💡 **INSIGHT** | Dicas baseadas em padrões | "🧠 Dica: Você é mais produtivo nas manhãs. Que tal agendar tarefas importantes antes das 10h?" |

### 🔄 Funcionamento Automático

O NeuroLink opera 24/7 através de jobs inteligentes:

- **⏱️ A cada 2 minutos**: Processa fila de notificações pendentes
- **🕐 A cada hora**: Verifica prazos próximos e agenda lembretes
- **🌅 Diariamente às 8h**: Identifica tarefas vencidas
- **📊 Semanalmente**: Gera insights de produtividade personalizados
- **🧹 Semanalmente**: Limpeza automática de dados antigos

### 📈 Sistema de Priorização Inteligente

O NeuroLink usa um algoritmo avançado que considera:

- **40%** - Urgência da tarefa (prazo, status)
- **20%** - Pontos da tarefa (valor)
- **15%** - Nível do usuário (engajamento)
- **15%** - Tipo de notificação (criticidade)
- **10%** - Contexto temporal (horário ativo)

### 🎛️ Configurações Personalizáveis

```json
{
  "personalidade": "casual",           // formal, casual, motivational, friendly
  "horario_inicio": "07:00",          // Início do horário ativo
  "horario_fim": "22:00",             // Fim do horário ativo
  "frequencia_maxima": 5,             // Máx notificações por dia
  "tipos_habilitados": [              // Tipos desejados
    "ALERT", "REMINDER", "MOTIVATION"
  ],
  "timezone": "America/Sao_Paulo"     // Fuso horário
}
```

## ✨ Recursos

### **Sistema de Usuários**
- Registro e autenticação seguros com JWT
- Perfil de usuário com níveis de experiência e sequência de produtividade
- **🧠 NeuroLink**: Notificações inteligentes personalizadas

### **Gerenciamento de Tarefas**
- Criação, edição e exclusão de tarefas
- Definição de prazos e níveis de pontuação
- Marcação de tarefas como concluídas
- Adiamento de tarefas (com penalidade de pontos)
- **🧠 NeuroLink**: Notificações automáticas em cada ação

### **Organização**
- Categorização de tarefas (trabalho, estudos, pessoal, etc.)
- Sistema de tags para melhor filtragem
- Categorias e tags padrão e personalizadas

### **Gamificação**
- Sistema de pontos de experiência (XP)
- Progressão de nível baseada em XP acumulado
- Sequência de produtividade diária (streaks)
- Penalidades por tarefas vencidas ou adiadas
- **🧠 NeuroLink**: Comemorações automáticas de conquistas

### **🧠 NeuroLink - Notificações Inteligentes**
- Geração de mensagens com IA contextual
- Sistema de filas com priorização dinâmica
- Personalização baseada no perfil do usuário
- Feedback learning para melhoria contínua
- Analytics avançados de engajamento
- Prevenção inteligente de spam

## 🔧 Tecnologias

### **Backend**
- Node.js
- Express.js
- Supabase (PostgreSQL)
- JWT para autenticação
- bcryptjs para criptografia de senhas
- Zod para validação de dados

### **🧠 NeuroLink**
- **Arcee AI Conductor** - IA generativa para notificações
- **node-cron** - Agendamento de jobs automáticos
- **axios** - Comunicação com APIs externas

### **Segurança**
- Helmet para proteção de cabeçalhos HTTP
- CORS para controle de acesso
- Tokens JWT com expiração
- Validação de dados com Zod

### **Documentação**
- Swagger/OpenAPI para documentação da API

## 🏗️ Arquitetura

### Arquitetura Geral (MVC)
Routina segue uma arquitetura MVC (Model-View-Controller) para manter o código organizado e escalável:

- **Models**: Gerenciam a interação com o banco de dados Supabase
- **Controllers**: Processam as requisições e enviam respostas apropriadas
- **Services**: Contêm a lógica de negócio da aplicação
- **Routes**: Definem os endpoints da API
- **Middlewares**: Processam as requisições antes dos controladores (ex: autenticação)
- **Utils**: Contêm funções utilitárias como validadores

### 🧠 Arquitetura do NeuroLink

```
NeuroLink System
├── 🤖 AIEngine              # Interface com Arcee AI
├── 🎯 QueueManager          # Gerenciamento inteligente de filas
├── ⚖️ PriorityCalculator    # Algoritmo de priorização
├── 🧩 PromptEngine          # Sistema de prompts dinâmicos
├── 👤 UserContextProcessor  # Análise de padrões do usuário
├── 📋 TaskContextProcessor  # Enriquecimento de contexto das tarefas
├── ⏰ NotificationScheduler # Jobs automáticos
└── 📊 NotificationModel     # Persistência e consultas
```

## 📥 Instalação

### Pré-requisitos

- Node.js (v14 ou superior)
- pnpm (recomendado) ou npm
- Conta no Supabase
- **🧠 Token da Arcee AI** ([Obter aqui](https://conductor.arcee.ai/))

### Passos para instalação

1. Clone o repositório:

```bash
git clone https://github.com/esc4n0rx/routina-backend
cd routina-backend
```

2. Instale as dependências:

```bash
pnpm install
# ou
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env` na raiz do projeto:

```env
PORT=3000
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_supabase
JWT_SECRET=seu_segredo_jwt

# 🧠 NeuroLink - Arcee AI Configuration
ARCEE_TOKEN=seu_token_arcee_aqui

# NeuroLink Settings (opcional)
NEUROLINK_BATCH_SIZE=10
NEUROLINK_MAX_RETRIES=3
NEUROLINK_TIMEOUT=30000
NEUROLINK_ENABLED=true
```

4. Crie as tabelas no Supabase:
   - Execute o SQL do sistema principal (ver seção [Modelos de Dados](#-modelos-de-dados))
   - **🧠 Execute o SQL do NeuroLink** (4 tabelas adicionais - ver [Documentação do NeuroLink](./docs/NEUROLINK.md))

5. Inicie o servidor:

```bash
# Modo de desenvolvimento
pnpm dev
# ou
npm run dev

# Modo de produção
pnpm start
# ou
npm start
```

Você verá estas mensagens indicando que tudo funcionou:
```
Servidor rodando na porta 3000
🧠 NeuroLink inicializado
✅ NeuroLink Scheduler iniciado com sucesso
```

## 🔌 Uso da API

### Autenticação

A API utiliza autenticação JWT. Para acessar endpoints protegidos, obtenha um token através do endpoint de login e inclua-o no cabeçalho de suas requisições:

```
Authorization: Bearer seu_token_jwt
```

### Exemplos de Requisições

#### Registro de Usuário

```http
POST /api/usuarios/registro
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

#### Login

```http
POST /api/usuarios/login
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

#### Criar Tarefa (com NeuroLink automático)

```http
POST /api/tarefas
Authorization: Bearer seu_token_jwt
Content-Type: application/json

{
  "nome": "Estudar Node.js",
  "descricao": "Estudar rotas e middlewares do Express",
  "data_vencimento": "2025-05-25",
  "hora_vencimento": "18:00",
  "pontos": 10,
  "categorias": ["id-categoria-1"],
  "tags": ["id-tag-1"]
}
```
> 🧠 **NeuroLink**: Automaticamente agenda notificações de confirmação e lembretes!

#### 🧠 NeuroLink - Gerar Notificação Manual

```http
POST /api/neurolink/generate
Authorization: Bearer seu_token_jwt
Content-Type: application/json

{
  "tipo": "MOTIVATION",
  "tarefa_id": "uuid-da-tarefa",
  "objetivo": "Motivar usuário a manter produtividade"
}
```

#### 🧠 NeuroLink - Listar Notificações

```http
GET /api/neurolink/notifications?status=SENT&limite=10
Authorization: Bearer seu_token_jwt
```

#### 🧠 NeuroLink - Configurar Preferências

```http
PUT /api/neurolink/settings
Authorization: Bearer seu_token_jwt
Content-Type: application/json

{
  "personalidade": "casual",
  "horario_inicio": "07:00",
  "horario_fim": "22:00",
  "frequencia_maxima": 5,
  "tipos_habilitados": ["ALERT", "REMINDER", "MOTIVATION"]
}
```

## 📚 Documentação da API

A documentação completa da API está disponível através do Swagger UI, acessível em:

```
http://localhost:3000/api-docs
```

Esta documentação interativa inclui:
- Todos os endpoints tradicionais do Routina
- **🧠 10 novos endpoints do NeuroLink**
- Exemplos de requisições e respostas
- Esquemas de dados detalhados
- Interface para testar a API diretamente

### 🧠 Endpoints do NeuroLink

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/neurolink/generate` | Gerar notificação com IA |
| `GET` | `/api/neurolink/notifications` | Listar notificações do usuário |
| `PATCH` | `/api/neurolink/notifications/{id}/read` | Marcar como lida |
| `POST` | `/api/neurolink/notifications/{id}/feedback` | Enviar feedback |
| `GET` | `/api/neurolink/settings` | Obter configurações |
| `PUT` | `/api/neurolink/settings` | Atualizar configurações |
| `POST` | `/api/neurolink/schedule` | Agendar notificações de tarefa |
| `GET` | `/api/neurolink/stats` | Estatísticas de engajamento |
| `GET` | `/api/neurolink/test-ai` | Testar conectividade da IA |
| `POST` | `/api/neurolink/process-queue` | Processar fila (admin) |

## 💾 Modelos de Dados

### Estrutura do Banco de Dados

O Routina utiliza as seguintes tabelas no Supabase:

#### Tabelas Principais
- `orbita_usuarios`: Armazena informações de usuários
- `orbita_tarefas`: Armazena as tarefas dos usuários
- `orbita_categorias`: Armazena categorias de tarefas
- `orbita_tags`: Armazena tags para classificação de tarefas
- `orbita_niveis`: Armazena configurações de níveis e XP necessário
- `orbita_usuario_categorias`: Relaciona usuários com suas categorias personalizadas
- `orbita_usuario_tags`: Relaciona usuários com suas tags personalizadas
- `orbita_tarefa_categorias`: Relaciona tarefas com categorias
- `orbita_tarefa_tags`: Relaciona tarefas com tags

#### 🧠 Tabelas do NeuroLink (4 novas)
- `orbita_notifications`: Armazena notificações geradas
- `orbita_notification_settings`: Configurações de notificação por usuário
- `orbita_notification_feedback`: Feedback dos usuários sobre notificações
- `orbita_user_context`: Contexto e padrões de comportamento dos usuários

### SQL para criação das tabelas

> **📋 Nota**: O SQL completo está na [Documentação Detalhada do NeuroLink](./docs/NEUROLINK.md)

## 📁 Estrutura de Diretórios

```
routina-backend/
├── config/             # Configurações da aplicação
│   └── database.js     # Configuração do Supabase
├── controllers/        # Controladores da aplicação
│   └── neurolinkController.js  # 🧠 Controller do NeuroLink
├── docs/               # Documentação
│   ├── swagger.js      # Configuração do Swagger
│   └── NEUROLINK.md    # 🧠 Documentação detalhada do NeuroLink
├── middlewares/        # Middlewares
│   └── authMiddleware.js # Middleware de autenticação
├── models/             # Modelos de dados
├── neurolink/          # 🧠 Sistema NeuroLink
│   ├── core/           # Motor principal
│   ├── queue/          # Sistema de filas
│   ├── templates/      # Templates de prompts
│   ├── processors/     # Processadores de contexto
│   ├── scheduler/      # Sistema de agendamento
│   └── models/         # Models específicos do NeuroLink
├── routes/             # Rotas da API
│   └── neurolinkRoutes.js  # 🧠 Rotas do NeuroLink
├── services/           # Serviços com lógica de negócio
├── utils/              # Utilitários
│   └── validadores.js  # Validadores com Zod (+ NeuroLink)
├── .env                # Variáveis de ambiente (não versionado)
├── .env.example        # Exemplo de variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
├── package.json        # Dependências e scripts
├── README.md           # Esta documentação
└── server.js           # Ponto de entrada da aplicação
```

## 🛠️ Desenvolvimento

### Scripts Disponíveis

- `pnpm start`: Inicia o servidor em modo de produção
- `pnpm dev`: Inicia o servidor em modo de desenvolvimento com hot-reload
- `pnpm test`: Executa os testes unitários

### Ambiente de Desenvolvimento

Para desenvolvimento local, você precisará:

1. Node.js instalado (v14 ou superior)
2. pnpm ou npm instalado
3. Um editor de código como VSCode
4. Postman, Insomnia ou outra ferramenta para testar APIs
5. Acesso ao console do Supabase
6. **🧠 Token da Arcee AI** para o NeuroLink

### 🧠 Desenvolvimento com NeuroLink

#### Testando o NeuroLink

1. **Verificar conectividade da IA**:
```bash
curl -X GET http://localhost:3000/api/neurolink/test-ai \
  -H "Authorization: Bearer seu_token"
```

2. **Gerar notificação de teste**:
```bash
curl -X POST http://localhost:3000/api/neurolink/generate \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"tipo": "MOTIVATION", "objetivo": "Teste de motivação"}'
```

3. **Monitorar logs do NeuroLink**:
```bash
# Os logs mostrarão:
# ✅ Notificações agendadas para tarefa uuid
# 📤 2 notificações enviadas
# 🧠 NeuroLink Scheduler iniciado com sucesso
```

#### Debugging

O NeuroLink possui logs detalhados para facilitar o debugging:

- `🧠` - Operações do NeuroLink
- `✅` - Sucessos
- `⚠️` - Avisos (fallbacks, limitações)
- `🚨` - Erros críticos
- `📊` - Estatísticas e métricas

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### 🧠 Contribuindo com o NeuroLink

O NeuroLink é um sistema complexo e há várias áreas para contribuição:

- **Templates de Prompts**: Novos templates para diferentes contextos
- **Algoritmos de Priorização**: Melhorias no cálculo de prioridade
- **Processadores de Contexto**: Análises mais avançadas de padrões
- **Integrações**: Novos provedores de IA além da Arcee
- **Analytics**: Métricas mais detalhadas de engajamento

Por favor, certifique-se de que seu código segue os padrões de estilo do projeto e inclua testes para novas funcionalidades.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

## 🧠 Documentação Detalhada do NeuroLink

Para informações técnicas completas sobre o NeuroLink, incluindo:
- Arquitetura detalhada
- Configuração avançada
- Customização de templates
- Análise de performance
- Troubleshooting

**[📖 Acesse a Documentação Completa do NeuroLink](./docs/NEUROLINK.md)**

---

<div align="center">
  
**Desenvolvido com ❤️ por [Esc4n0rx]**

**Agora com 🧠 NeuroLink - A primeira biblioteca de notificações inteligentes com IA**

</div>