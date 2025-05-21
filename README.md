# Routina - Sistema Inteligente para Gerenciamento da sua Rotina

<div align="center">
  <img src="https://i.ibb.co/27RfFhG1/logo.png" alt="Routina Logo" width="150">
  <h3>Organize suas tarefas. Evolua. Conquiste.</h3>
</div>

## 📋 Índice

- [Visão Geral](#-visão-geral)
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

## ✨ Recursos

- **Sistema de Usuários**:
  - Registro e autenticação seguros com JWT
  - Perfil de usuário com níveis de experiência e sequência de produtividade

- **Gerenciamento de Tarefas**:
  - Criação, edição e exclusão de tarefas
  - Definição de prazos e níveis de pontuação
  - Marcação de tarefas como concluídas
  - Adiamento de tarefas (com penalidade de pontos)

- **Organização**:
  - Categorização de tarefas (trabalho, estudos, pessoal, etc.)
  - Sistema de tags para melhor filtragem
  - Categorias e tags padrão e personalizadas

- **Gamificação**:
  - Sistema de pontos de experiência (XP)
  - Progressão de nível baseada em XP acumulado
  - Sequência de produtividade diária (streaks)
  - Penalidades por tarefas vencidas ou adiadas

## 🔧 Tecnologias

- **Backend**:
  - Node.js
  - Express.js
  - Supabase (PostgreSQL)
  - JWT para autenticação
  - bcryptjs para criptografia de senhas
  - Zod para validação de dados

- **Segurança**:
  - Helmet para proteção de cabeçalhos HTTP
  - CORS para controle de acesso
  - Tokens JWT com expiração
  - Validação de dados com Zod

- **Documentação**:
  - Swagger/OpenAPI para documentação da API

## 🏗️ Arquitetura

Routina segue uma arquitetura MVC (Model-View-Controller) para manter o código organizado e escalável:

- **Models**: Gerenciam a interação com o banco de dados Supabase
- **Controllers**: Processam as requisições e enviam respostas apropriadas
- **Services**: Contêm a lógica de negócio da aplicação
- **Routes**: Definem os endpoints da API
- **Middlewares**: Processam as requisições antes dos controladores (ex: autenticação)
- **Utils**: Contêm funções utilitárias como validadores

## 📥 Instalação

### Pré-requisitos

- Node.js (v14 ou superior)
- pnpm (recomendado) ou npm
- Conta no Supabase

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

```
PORT=3000
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_supabase
JWT_SECRET=seu_segredo_jwt
```

4. Crie as tabelas no Supabase (SQL disponível na seção [Modelos de Dados](#-modelos-de-dados))

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

Resposta:

```json
{
  "erro": false,
  "mensagem": "Login realizado com sucesso",
  "usuario": {
    "id": "uuid-do-usuario",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "nivel": 1,
    "pontos_xp": 0,
    "sequencia": 0,
    "criado_em": "2025-05-21T12:00:00Z"
  },
  "token": "seu_token_jwt"
}
```

#### Criar Tarefa

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
  "categorias": ["id-categoria-1", "id-categoria-2"],
  "tags": ["id-tag-1"]
}
```

#### Concluir Tarefa

```http
PATCH /api/tarefas/{id-da-tarefa}/concluir
Authorization: Bearer seu_token_jwt
```

## 📚 Documentação da API

A documentação completa da API está disponível através do Swagger UI, acessível em:

```
http://localhost:3000/api-docs
```

Esta documentação interativa permite explorar todos os endpoints, ver exemplos de requisições e respostas, e testar a API diretamente do navegador.

## 💾 Modelos de Dados

### Estrutura do Banco de Dados

O Routina utiliza as seguintes tabelas no Supabase:

- `orbita_usuarios`: Armazena informações de usuários
- `orbita_tarefas`: Armazena as tarefas dos usuários
- `orbita_categorias`: Armazena categorias de tarefas
- `orbita_tags`: Armazena tags para classificação de tarefas
- `orbita_niveis`: Armazena configurações de níveis e XP necessário
- `orbita_usuario_categorias`: Relaciona usuários com suas categorias personalizadas
- `orbita_usuario_tags`: Relaciona usuários com suas tags personalizadas
- `orbita_tarefa_categorias`: Relaciona tarefas com categorias
- `orbita_tarefa_tags`: Relaciona tarefas com tags

### SQL para criação das tabelas

```sql
-- Tabela de Usuários
CREATE TABLE orbita_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  pontos_xp INTEGER NOT NULL DEFAULT 0,
  sequencia INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Níveis
CREATE TABLE orbita_niveis (
  nivel INTEGER PRIMARY KEY,
  pontos_necessarios INTEGER NOT NULL,
  descricao VARCHAR(255)
);

-- Tabela de Tarefas
CREATE TABLE orbita_tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES orbita_usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_vencimento DATE NOT NULL,
  hora_vencimento TIME,
  pontos INTEGER NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT FALSE,
  vencida BOOLEAN NOT NULL DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_conclusao TIMESTAMP WITH TIME ZONE,
  CONSTRAINT pontos_range CHECK (pontos BETWEEN 1 AND 20)
);

-- Tabela de Categorias
CREATE TABLE orbita_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cor VARCHAR(7) DEFAULT '#000000',
  icone VARCHAR(50),
  padrao BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tabela de Tags
CREATE TABLE orbita_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cor VARCHAR(7) DEFAULT '#000000',
  padrao BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tabela de relação Usuário-Categoria para categorias personalizadas
CREATE TABLE orbita_usuario_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES orbita_usuarios(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES orbita_categorias(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, categoria_id)
);

-- Tabela de relação Usuário-Tag para tags personalizadas
CREATE TABLE orbita_usuario_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES orbita_usuarios(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES orbita_tags(id) ON DELETE CASCADE,
  UNIQUE(usuario_id, tag_id)
);

-- Tabela de relação Tarefa-Categoria
CREATE TABLE orbita_tarefa_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarefa_id UUID NOT NULL REFERENCES orbita_tarefas(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES orbita_categorias(id) ON DELETE CASCADE,
  UNIQUE(tarefa_id, categoria_id)
);

-- Tabela de relação Tarefa-Tag
CREATE TABLE orbita_tarefa_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarefa_id UUID NOT NULL REFERENCES orbita_tarefas(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES orbita_tags(id) ON DELETE CASCADE,
  UNIQUE(tarefa_id, tag_id)
);

-- Inserir níveis iniciais
INSERT INTO orbita_niveis (nivel, pontos_necessarios, descricao) VALUES
(1, 0, 'Iniciante'),
(2, 100, 'Aprendiz'),
(3, 250, 'Praticante'),
(4, 500, 'Disciplinado'),
(5, 1000, 'Especialista'),
(6, 2000, 'Mestre'),
(7, 3500, 'Guru'),
(8, 5000, 'Lendário');

-- Inserir categorias padrão
INSERT INTO orbita_categorias (nome, cor, icone, padrao) VALUES
('Trabalho', '#FF5733', 'briefcase', TRUE),
('Estudos', '#33A1FF', 'book', TRUE),
('Pessoal', '#33FF57', 'user', TRUE),
('Saúde', '#E033FF', 'heart', TRUE),
('Finanças', '#FFD700', 'dollar-sign', TRUE);

-- Inserir tags padrão
INSERT INTO orbita_tags (nome, cor, padrao) VALUES
('Urgente', '#FF0000', TRUE),
('Importante', '#FFA500', TRUE),
('Fácil', '#00FF00', TRUE),
('Difícil', '#8B4513', TRUE),
('Longo Prazo', '#4B0082', TRUE);
```

## 📁 Estrutura de Diretórios

```
routina-backend/
├── config/             # Configurações da aplicação
│   └── database.js     # Configuração do Supabase
├── controllers/        # Controladores da aplicação
├── docs/               # Documentação
│   └── swagger.js      # Configuração do Swagger
├── middlewares/        # Middlewares
│   └── authMiddleware.js # Middleware de autenticação
├── models/             # Modelos de dados
├── routes/             # Rotas da API
├── services/           # Serviços com lógica de negócio
├── utils/              # Utilitários
│   └── validadores.js  # Validadores com Zod
├── .env                # Variáveis de ambiente (não versionado)
├── .env.example        # Exemplo de variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
├── package.json        # Dependências e scripts
├── README.md           # Documentação
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

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

Por favor, certifique-se de que seu código segue os padrões de estilo do projeto e inclua testes para novas funcionalidades.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

---

Desenvolvido com ❤️ por [Esc4n0rx]