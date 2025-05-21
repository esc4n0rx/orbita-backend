# Routina API - Schema e Documentação

Este documento contém o schema completo da API Routina, incluindo todas as rotas, payloads necessários e formatos de resposta.

## Índice

- [Autenticação](#autenticação)
- [Usuários](#usuários)
- [Tarefas](#tarefas)
- [Categorias](#categorias)
- [Tags](#tags)

## Autenticação

A API Routina utiliza autenticação baseada em tokens JWT (JSON Web Token). Para endpoints protegidos, inclua o token no cabeçalho de autorização:

```
Authorization: Bearer seu_token_jwt
```

## Usuários

### Registro de Usuário

**Endpoint:** `POST /api/usuarios/registro`

**Descrição:** Cria uma nova conta de usuário no sistema.

**Payload de Requisição:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "erro": false,
  "mensagem": "Usuário registrado com sucesso",
  "usuario": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "nivel": 1,
    "pontos_xp": 0,
    "sequencia": 0,
    "criado_em": "2025-05-21T12:00:00Z"
  }
}
```

**Resposta de Erro (400) - Dados Inválidos:**
```json
{
  "erro": true,
  "mensagem": "Dados inválidos",
  "detalhes": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Nome deve ter pelo menos 3 caracteres",
      "path": ["nome"]
    }
  ]
}
```

**Resposta de Erro (409) - Email Duplicado:**
```json
{
  "erro": true,
  "mensagem": "Email já está em uso"
}
```

### Login de Usuário

**Endpoint:** `POST /api/usuarios/login`

**Descrição:** Autentica o usuário e retorna um token JWT.

**Payload de Requisição:**
```json
{
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Login realizado com sucesso",
  "usuario": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "nivel": 1,
    "pontos_xp": 0,
    "sequencia": 0,
    "criado_em": "2025-05-21T12:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de Erro (400) - Dados Inválidos:**
```json
{
  "erro": true,
  "mensagem": "Dados inválidos",
  "detalhes": [
    {
      "code": "invalid_string",
      "validation": "email",
      "message": "Email inválido",
      "path": ["email"]
    }
  ]
}
```

**Resposta de Erro (401) - Credenciais Inválidas:**
```json
{
  "erro": true,
  "mensagem": "Credenciais inválidas"
}
```

### Validar Token

**Endpoint:** `GET /api/usuarios/validar`

**Descrição:** Valida o token JWT e retorna as informações do usuário.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Token válido",
  "usuario": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "nivel": 1,
    "pontos_xp": 0,
    "sequencia": 0,
    "criado_em": "2025-05-21T12:00:00Z"
  }
}
```

**Resposta de Erro (401) - Token Inválido:**
```json
{
  "erro": true,
  "mensagem": "Token inválido"
}
```

## Tarefas

### Criar Tarefa

**Endpoint:** `POST /api/tarefas`

**Descrição:** Cria uma nova tarefa para o usuário autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "nome": "Estudar Node.js",
  "descricao": "Estudar rotas e middlewares do Express",
  "data_vencimento": "2025-05-25",
  "hora_vencimento": "18:00",
  "pontos": 10,
  "categorias": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "tags": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
}
```

**Resposta de Sucesso (201):**
```json
{
  "erro": false,
  "mensagem": "Tarefa criada com sucesso",
  "tarefa": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Estudar Node.js",
    "descricao": "Estudar rotas e middlewares do Express",
    "data_vencimento": "2025-05-25",
    "hora_vencimento": "18:00:00",
    "pontos": 10,
    "concluida": false,
    "vencida": false,
    "data_criacao": "2025-05-21T12:00:00Z",
    "data_conclusao": null,
    "categorias": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "nome": "Estudos",
        "cor": "#33A1FF",
        "icone": "book",
        "padrao": true
      }
    ],
    "tags": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "nome": "Importante",
        "cor": "#FFA500",
        "padrao": true
      }
    ]
  }
}
```

### Listar Tarefas

**Endpoint:** `GET /api/tarefas`

**Descrição:** Lista todas as tarefas do usuário autenticado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "tarefas": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Estudar Node.js",
      "descricao": "Estudar rotas e middlewares do Express",
      "data_vencimento": "2025-05-25",
      "hora_vencimento": "18:00:00",
      "pontos": 10,
      "concluida": false,
      "vencida": false,
      "data_criacao": "2025-05-21T12:00:00Z",
      "data_conclusao": null,
      "categorias": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "nome": "Estudos",
          "cor": "#33A1FF",
          "icone": "book",
          "padrao": true
        }
      ],
      "tags": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "nome": "Importante",
          "cor": "#FFA500",
          "padrao": true
        }
      ]
    }
  ]
}
```

### Obter Tarefa por ID

**Endpoint:** `GET /api/tarefas/{id}`

**Descrição:** Obtém os detalhes de uma tarefa específica.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "tarefa": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Estudar Node.js",
    "descricao": "Estudar rotas e middlewares do Express",
    "data_vencimento": "2025-05-25",
    "hora_vencimento": "18:00:00",
    "pontos": 10,
    "concluida": false,
    "vencida": false,
    "data_criacao": "2025-05-21T12:00:00Z",
    "data_conclusao": null,
    "categorias": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "nome": "Estudos",
        "cor": "#33A1FF",
        "icone": "book",
        "padrao": true
      }
    ],
    "tags": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "nome": "Importante",
        "cor": "#FFA500",
        "padrao": true
      }
    ]
  }
}
```

**Resposta de Erro (404) - Tarefa Não Encontrada:**
```json
{
  "erro": true,
  "mensagem": "Tarefa não encontrada"
}
```

### Atualizar Tarefa

**Endpoint:** `PUT /api/tarefas/{id}`

**Descrição:** Atualiza os dados de uma tarefa existente.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "nome": "Estudar Node.js Avançado",
  "descricao": "Estudar middlewares, autenticação e JWT",
  "data_vencimento": "2025-05-26",
  "hora_vencimento": "19:00",
  "pontos": 15
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tarefa atualizada com sucesso",
  "tarefa": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Estudar Node.js Avançado",
    "descricao": "Estudar middlewares, autenticação e JWT",
    "data_vencimento": "2025-05-26",
    "hora_vencimento": "19:00:00",
    "pontos": 15,
    "concluida": false,
    "vencida": false,
    "data_criacao": "2025-05-21T12:00:00Z",
    "data_conclusao": null
  }
}
```

### Adiar Tarefa

**Endpoint:** `PATCH /api/tarefas/{id}/adiar`

**Descrição:** Adia o prazo de uma tarefa (com penalidade de pontos).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "data_vencimento": "2025-05-30",
  "hora_vencimento": "19:00"
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tarefa adiada com sucesso. Você perdeu 3 pontos desta tarefa.",
  "tarefa": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Estudar Node.js",
    "descricao": "Estudar rotas e middlewares do Express",
    "data_vencimento": "2025-05-30",
    "hora_vencimento": "19:00:00",
    "pontos": 7,
    "concluida": false,
    "vencida": false,
    "data_criacao": "2025-05-21T12:00:00Z",
    "data_conclusao": null
  }
}
```

**Resposta de Erro (400) - Tarefa já Concluída:**
```json
{
  "erro": true,
  "mensagem": "Não é possível adiar uma tarefa já concluída"
}
```

### Concluir Tarefa

**Endpoint:** `PATCH /api/tarefas/{id}/concluir`

**Descrição:** Marca uma tarefa como concluída e atualiza pontos de experiência.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tarefa concluída com sucesso",
  "tarefa": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Estudar Node.js",
    "descricao": "Estudar rotas e middlewares do Express",
    "data_vencimento": "2025-05-25",
    "hora_vencimento": "18:00:00",
    "pontos": 10,
    "concluida": true,
    "vencida": false,
    "data_criacao": "2025-05-21T12:00:00Z",
    "data_conclusao": "2025-05-22T14:30:00Z"
  }
}
```

**Resposta de Sucesso (200) - Tarefa Vencida:**
```json
{
  "erro": false,
  "mensagem": "Tarefa marcada como vencida. Nenhum ponto foi adicionado.",
  "tarefa": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "usuario_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Estudar Node.js",
    "descricao": "Estudar rotas e middlewares do Express",
    "data_vencimento": "2025-05-20",
    "hora_vencimento": "18:00:00",
    "pontos": 10,
    "concluida": true,
    "vencida": true,
    "data_criacao": "2025-05-10T12:00:00Z",
    "data_conclusao": "2025-05-22T14:30:00Z"
  }
}
```

**Resposta de Erro (400) - Tarefa já Concluída:**
```json
{
  "erro": true,
  "mensagem": "Tarefa já foi concluída"
}
```

### Excluir Tarefa

**Endpoint:** `DELETE /api/tarefas/{id}`

**Descrição:** Remove uma tarefa do sistema.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tarefa excluída com sucesso"
}
```

### Adicionar Categoria a uma Tarefa

**Endpoint:** `POST /api/tarefas/{id}/categorias`

**Descrição:** Associa uma categoria a uma tarefa.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "categoria_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Categoria adicionada à tarefa com sucesso",
  "categorias": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Estudos",
      "cor": "#33A1FF",
      "icone": "book",
      "padrao": true
    }
  ]
}
```

### Remover Categoria de uma Tarefa

**Endpoint:** `DELETE /api/tarefas/{tarefaId}/categorias/{categoriaId}`

**Descrição:** Remove a associação entre uma categoria e uma tarefa.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Categoria removida da tarefa com sucesso"
}
```

### Listar Categorias de uma Tarefa

**Endpoint:** `GET /api/tarefas/{id}/categorias`

**Descrição:** Lista todas as categorias associadas a uma tarefa.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "categorias": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Estudos",
      "cor": "#33A1FF",
      "icone": "book",
      "padrao": true
    },
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
      "nome": "Pessoal",
      "cor": "#33FF57",
      "icone": "user",
      "padrao": true
    }
  ]
}
```

### Adicionar Tag a uma Tarefa

**Endpoint:** `POST /api/tarefas/{id}/tags`

**Descrição:** Associa uma tag a uma tarefa.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "tag_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tag adicionada à tarefa com sucesso",
  "tags": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Importante",
      "cor": "#FFA500",
      "padrao": true
    }
  ]
}
```

### Remover Tag de uma Tarefa

**Endpoint:** `DELETE /api/tarefas/{tarefaId}/tags/{tagId}`

**Descrição:** Remove a associação entre uma tag e uma tarefa.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tag removida da tarefa com sucesso"
}
```

### Listar Tags de uma Tarefa

**Endpoint:** `GET /api/tarefas/{id}/tags`

**Descrição:** Lista todas as tags associadas a uma tarefa.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "tags": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Importante",
      "cor": "#FFA500",
      "padrao": true
    },
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
      "nome": "Urgente",
      "cor": "#FF0000",
      "padrao": true
    }
  ]
}
```

## Categorias

### Listar Categorias

**Endpoint:** `GET /api/categorias`

**Descrição:** Lista todas as categorias disponíveis para o usuário (padrão + personalizadas).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "categorias": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Trabalho",
      "cor": "#FF5733",
      "icone": "briefcase",
      "padrao": true
    },
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
      "nome": "Estudos",
      "cor": "#33A1FF",
      "icone": "book",
      "padrao": true
    }
  ]
}
```

### Criar Categoria

**Endpoint:** `POST /api/categorias`

**Descrição:** Cria uma nova categoria personalizada para o usuário.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "nome": "Projeto TCC",
  "cor": "#8A2BE2",
  "icone": "graduation-cap"
}
```

**Resposta de Sucesso (201):**
```json
{
  "erro": false,
  "mensagem": "Categoria criada com sucesso",
  "categoria": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Projeto TCC",
    "cor": "#8A2BE2",
    "icone": "graduation-cap",
    "padrao": false
  }
}
```

### Atualizar Categoria

**Endpoint:** `PUT /api/categorias/{id}`

**Descrição:** Atualiza os dados de uma categoria personalizada.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "nome": "Projeto Final",
  "cor": "#9932CC",
  "icone": "project-diagram"
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Categoria atualizada com sucesso",
  "categoria": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Projeto Final",
    "cor": "#9932CC",
    "icone": "project-diagram",
    "padrao": false
  }
}
```

**Resposta de Erro (403) - Categoria Padrão:**
```json
{
  "erro": true,
  "mensagem": "Não é possível atualizar uma categoria padrão"
}
```

### Excluir Categoria

**Endpoint:** `DELETE /api/categorias/{id}`

**Descrição:** Remove uma categoria personalizada.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Categoria excluída com sucesso"
}
```

**Resposta de Erro (403) - Categoria Padrão:**
```json
{
  "erro": true,
  "mensagem": "Não é possível excluir uma categoria padrão"
}
```

## Tags

### Listar Tags

**Endpoint:** `GET /api/tags`

**Descrição:** Lista todas as tags disponíveis para o usuário (padrão + personalizadas).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "tags": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "nome": "Urgente",
      "cor": "#FF0000",
      "padrao": true
    },
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
      "nome": "Importante",
      "cor": "#FFA500",
      "padrao": true
    }
  ]
}
```

### Criar Tag

**Endpoint:** `POST /api/tags`

**Descrição:** Cria uma nova tag personalizada para o usuário.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "nome": "Em andamento",
  "cor": "#1E90FF"
}
```

**Resposta de Sucesso (201):**
```json
{
  "erro": false,
  "mensagem": "Tag criada com sucesso",
  "tag": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Em andamento",
    "cor": "#1E90FF",
    "padrao": false
  }
}
```

### Atualizar Tag

**Endpoint:** `PUT /api/tags/{id}`

**Descrição:** Atualiza os dados de uma tag personalizada.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload de Requisição:**
```json
{
  "nome": "Em progresso",
  "cor": "#4169E1"
}
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tag atualizada com sucesso",
  "tag": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "nome": "Em progresso",
    "cor": "#4169E1",
    "padrao": false
  }
}
```

**Resposta de Erro (403) - Tag Padrão:**
```json
{
  "erro": true,
  "mensagem": "Não é possível atualizar uma tag padrão"
}
```

### Excluir Tag

**Endpoint:** `DELETE /api/tags/{id}`

**Descrição:** Remove uma tag personalizada.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "erro": false,
  "mensagem": "Tag excluída com sucesso"
}
```

**Resposta de Erro (403) - Tag Padrão:**
```json
{
  "erro": true,
  "mensagem": "Não é possível excluir uma tag padrão"
}
```