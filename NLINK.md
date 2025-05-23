# NeuroLink Frontend API Reference

## Base URL
```
https://api.routina.fun/api/neurolink
```

## Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## 1. Listar Notificações

### `GET /notifications`

**Query Params:**
- `status` (opcional): `PENDING` | `SENT` | `read` | `DISMISSED`
- `tipo` (opcional): `ALERT` | `REMINDER` | `MOTIVATION` | `ACHIEVEMENT` | `PROGRESS` | `INSIGHT`
- `limite` (opcional): number (default: 20)

**Response:**
```json
{
  "erro": false,
  "notifications": [
    {
      "id": "uuid",
      "tipo": "REMINDER",
      "titulo": "📚 Hora do Node.js!",
      "mensagem": "Que tal dar uma olhada na tarefa 'Estudar Node.js'?",
      "status": "SENT",
      "prioridade": 6,
      "agendado_para": "2025-05-22T14:00:00Z",
      "enviado_em": "2025-05-22T14:00:15Z",
      "lido_em": null,
      "criado_em": "2025-05-22T13:58:30Z",
      "metadata": {
        "tom": "casual",
        "emoji_principal": "📚",
        "generated_with_ai": true
      }
    }
  ],
  "total": 1
}
```

---

## 2. Marcar Como Lida

### `PATCH /notifications/{id}/read`

**Response:**
```json
{
  "erro": false,
  "mensagem": "Notificação marcada como lida",
  "notification": {
    "id": "uuid",
    "status": "read",
    "lido_em": "2025-05-22T14:05:30Z"
  }
}
```

---

## 3. Configurações do Usuário

### `GET /settings`

**Response:**
```json
{
  "erro": false,
  "configuracoes": {
    "personalidade": "casual",
    "horario_inicio": "07:00",
    "horario_fim": "22:00",
    "frequencia_maxima": 5,
    "tipos_habilitados": ["ALERT", "REMINDER", "MOTIVATION"],
    "timezone": "America/Sao_Paulo"
  }
}
```

### `PUT /settings`

**Request Body:**
```json
{
  "personalidade": "motivational",
  "horario_inicio": "08:00",
  "horario_fim": "23:00",
  "frequencia_maxima": 7,
  "tipos_habilitados": ["ALERT", "REMINDER", "MOTIVATION", "ACHIEVEMENT"],
  "timezone": "America/Sao_Paulo"
}
```

**Response:**
```json
{
  "erro": false,
  "mensagem": "Configurações atualizadas com sucesso",
  "configuracoes": { /* mesma estrutura do GET */ }
}
```

---

## 4. Estatísticas

### `GET /stats`

**Response:**
```json
{
  "erro": false,
  "statistics": {
    "total_notifications": 45,
    "sent_notifications": 42,
    "read_notifications": 38,
    "read_rate": "90.5",
    "types_breakdown": {
      "REMINDER": 20,
      "MOTIVATION": 15,
      "ALERT": 7,
      "ACHIEVEMENT": 3
    },
    "priority_breakdown": {
      "P1": 5,
      "P2": 12,
      "P3": 15,
      "P4": 10
    },
    "engagement_score": "92.3"
  }
}
```

---

## 5. Feedback de Notificação

### `POST /notifications/{id}/feedback`

**Request Body:**
```json
{
  "feedback_tipo": "helpful",
  "comentario": "Notificação muito útil e no momento certo!"
}
```

**Tipos de Feedback:**
- `helpful`: Útil e relevante
- `perfect`: Perfeita timing e conteúdo
- `annoying`: Irritante/excessiva
- `irrelevant`: Irrelevante
- `too_early`: Muito cedo
- `too_late`: Muito tarde

**Response:**
```json
{
  "erro": false,
  "mensagem": "Feedback enviado com sucesso",
  "feedback": {
    "id": "uuid",
    "feedback_tipo": "helpful",
    "comentario": "...",
    "criado_em": "2025-05-22T14:10:00Z"
  }
}
```

---

## 6. Gerar Notificação Manual (Opcional)

### `POST /generate`

**Request Body:**
```json
{
  "tipo": "MOTIVATION",
  "tarefa_id": "uuid-opcional",
  "objetivo": "Motivar usuário a manter produtividade"
}
```

**Response:**
```json
{
  "erro": false,
  "mensagem": "Notificação gerada e adicionada à fila",
  "notification": {
    "id": "uuid",
    "tipo": "MOTIVATION",
    "titulo": "🚀 Continue assim!",
    "mensagem": "Você está indo muito bem...",
    "prioridade": 6,
    "agendado_para": "2025-05-22T15:00:00Z"
  }
}
```

## 🔔 Push Notifications API
### 7. Obter Chave Pública VAPID

**GET /api/push/public-key**

⚠️ Não requer autenticação

**Response (configurado):**

```json
{
  "erro": false,
  "public_key": "<chave_vapid>",
  "configurado": true
}
```

**Response (não configurado):**

```json
{
  "erro": true,
  "mensagem": "Push notifications não estão configuradas no servidor"
}
```

---

### 8. Status das Push Notifications

**GET /api/push/status**

**Response:**

```json
{
  "erro": false,
  "push_notifications": {
    "configurado": true,
    "vapid_configurado": true,
    "chave_publica_disponivel": true
  }
}
```

---

### 9. Registrar Subscription

**POST /api/push/subscribe**

**Request Body:**

```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "deviceInfo": {
    "userAgent": "...",
    "platform": "..."
  }
}
```

**Response:**

```json
{
  "erro": false,
  "mensagem": "Push notifications ativadas com sucesso",
  "subscription_id": "uuid"
}
```

---

### 10. Remover Subscription

**POST /api/push/unsubscribe**

**Request Body:**

```json
{
  "endpoint": "https://..."
}
```

**Response:**

```json
{
  "erro": false,
  "mensagem": "Push notifications desativadas"
}
```

---

### 11. Testar Push Notification

**POST /api/push/test**

**Response (com subscriptions):**

```json
{
  "erro": false,
  "mensagem": "Push notification de teste enviada",
  "estatisticas": {
    "enviadas": 1,
    "falharam": 0,
    "total_subscriptions": 1
  }
}
```

**Response (sem subscriptions):**

```json
{
  "erro": true,
  "mensagem": "Usuário não possui subscriptions ativas"
}
```

---

## 📱 Implementação Frontend - Push Notifications

### 1. Verificar Suporte do Browser

```javascript
function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}
```

### 2. Registrar Service Worker

```javascript
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      throw error;
    }
  }
}
```

### 3. Solicitar Permissão e Obter Subscription

```javascript
async function subscribeToPush() {
  try {
    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      throw new Error('Permissão para notificações negada');
    }

    const registration = await registerServiceWorker();

    const keyResponse = await fetch('/api/push/public-key');
    const keyData = await keyResponse.json();

    if (keyData.erro) {
      throw new Error(keyData.mensagem);
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.public_key)
    });

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      })
    });

    const result = await response.json();

    if (result.erro) {
      throw new Error(result.mensagem);
    }

    console.log('✅ Push notifications ativadas:', result);
    return subscription;

  } catch (error) {
    console.error('❌ Erro ao ativar push notifications:', error);
    throw error;
  }
}
```

### 4. Service Worker (sw\.js)

```javascript
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/icons/notification-icon.png',
    badge: data.badge || '/icons/badge-icon.png',
    data: data.data,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    tag: data.data?.id || 'neurolink-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data;
  const url = data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );

  if (data?.id) {
    fetch(`/api/neurolink/notifications/${data.id}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getStoredAuthToken()}`
      }
    }).catch(console.error);
  }
});
```

### 5. Desativar Push Notifications

```javascript
async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (!subscription) {
      throw new Error('Nenhuma subscription encontrada');
    }

    await subscription.unsubscribe();

    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });

    const result = await response.json();

    if (result.erro) {
      throw new Error(result.mensagem);
    }

    console.log('✅ Push notifications desativadas');
  } catch (error) {
    console.error('❌ Erro ao desativar push notifications:', error);
    throw error;
  }
}
```

### 6. Verificar Status das Notificações

```javascript
async function checkPushStatus() {
  try {
    if (!isPushSupported()) {
      return { supported: false, subscribed: false };
    }

    const permission = Notification.permission;
    if (permission !== 'granted') {
      return { supported: true, subscribed: false, permission };
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    return {
      supported: true,
      subscribed: !!subscription,
      permission,
      endpoint: subscription?.endpoint
    };
  } catch (error) {
    console.error('Erro ao verificar status das push notifications:', error);
    return { supported: false, subscribed: false, error: error.message };
  }
}
```

---

## Configurações - Opções Válidas

### Personalidade

* `formal`: Tom respeitoso e profissional
* `casual`: Amigável e descontraído
* `motivational`: Energético e inspirador
* `friendly`: Caloroso e empático

### Tipos de Notificação

* `ALERT`: Urgências e prazos críticos
* `REMINDER`: Lembretes amigáveis
* `MOTIVATION`: Impulsos motivacionais
* `ACHIEVEMENT`: Comemorações de conquistas
* `PROGRESS`: Relatórios de progresso
* `INSIGHT`: Dicas personalizadas

### Status de Notificação

* `PENDING`: Agendada, não enviada
* `SENT`: Enviada ao usuário
* `read`: Lida pelo usuário
* `DISMISSED`: Descartada

---

## Fluxo Recomendado

1. `GET /settings` — Carregar configurações do usuário
2. `GET /notifications?status=SENT` — Listar notificações não lidas
3. Exibir notificação no frontend
4. `PATCH /notifications/{id}/read` — Marcar como lida
5. `POST /notifications/{id}/feedback` — Coletar feedback (opcional)
6. `GET /stats` — Mostrar estatísticas

---

## Polling para Novas Notificações

```javascript
setInterval(async () => {
  const response = await fetch('/api/neurolink/notifications?status=SENT&limite=5');
  const data = await response.json();

  data.notifications.forEach(notif => {
    showNotification(notif);
    markAsRead(notif.id);
  });
}, 30000);
```

---

## Tratamento de Erros

Todas as rotas retornam a estrutura:

```json
{
  "erro": true,
  "mensagem": "Descrição do erro"
}
```

**Status Codes:**

* `400`: Dados inválidos
* `401`: Não autorizado
* `404`: Recurso não encontrado
* `429`: Limite de notificações atingido
* `500`: Erro interno
