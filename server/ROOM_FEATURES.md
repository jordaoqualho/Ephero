# Funcionalidades de Sala - Ephero WebSocket Server

## Visão Geral

O servidor WebSocket do Ephero implementa um sistema completo de salas efêmeras com as seguintes funcionalidades principais:

## ✅ Funcionalidades Implementadas

### 1. **Entrada em Sala por RoomId**

- Clientes podem entrar em salas existentes usando o ID da sala
- Validação de existência da sala
- Controle de capacidade máxima (10 clientes por sala)

**Exemplo:**

```javascript
// Entrar em uma sala existente
ws.send(
  JSON.stringify({
    type: "join_room",
    roomId: "ABC12345",
  })
);
```

### 2. **Rastreamento de Clientes**

- Contagem em tempo real de clientes na sala
- Notificações automáticas quando clientes entram/saem
- Informações detalhadas sobre cada sala ativa

**Eventos de rastreamento:**

```javascript
// Cliente entrou na sala
{
  type: 'user_joined',
  userId: 'client123',
  timestamp: 1640995200000
}

// Cliente saiu da sala
{
  type: 'user_left',
  userId: 'client123',
  timestamp: 1640995200000
}
```

### 3. **Broadcasting de Dados**

- Mensagens são enviadas para todos os clientes na sala
- Exclusão automática do remetente (não recebe sua própria mensagem)
- Suporte a diferentes tipos de dados

**Exemplo de broadcasting:**

```javascript
// Enviar mensagem para todos na sala
ws.send(JSON.stringify({
  type: 'message',
  message: 'Dados criptografados aqui'
}));

// Receber mensagem (todos exceto o remetente)
{
  type: 'message',
  userId: 'client123',
  message: 'Dados criptografados aqui',
  timestamp: 1640995200000
}
```

## 🔧 Implementação Técnica

### **Modelo Room**

```javascript
class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Set(); // Rastreamento de clientes
    this.maxClients = 10; // Capacidade máxima
    this.ttl = 30 * 60 * 1000; // 30 minutos TTL
  }

  addClient(client) {
    /* ... */
  }
  removeClient(client) {
    /* ... */
  }
  broadcast(message, excludeClient) {
    /* ... */
  }
}
```

### **RoomService**

```javascript
class RoomService {
  addClientToRoom(roomId, client) {
    /* ... */
  }
  removeClientFromRoom(client) {
    /* ... */
  }
  getActiveRooms() {
    /* ... */
  }
}
```

### **MessageHandler**

```javascript
class MessageHandler {
  handleJoinRoom(client, data) {
    /* ... */
  }
  handleMessage(client, data) {
    /* ... */
  }
  handleLeaveRoom(client) {
    /* ... */
  }
}
```

## 🧪 Testes

### **Executar Testes de Funcionalidade**

```bash
cd server
npm run test:room
```

### **Testes Incluídos**

1. **Criação de Sala** - Verifica se salas são criadas corretamente
2. **Entrada por RoomId** - Testa entrada em sala existente
3. **Broadcasting** - Verifica se mensagens chegam a todos os clientes
4. **Rastreamento** - Confirma contagem correta de clientes
5. **Saída de Sala** - Testa notificações de saída

## 📊 Fluxo de Dados

```
Cliente A                    Servidor                    Cliente B
    |                           |                           |
    |-- join_room(ABC123) ---->|                           |
    |<-- room_joined ----------|                           |
    |                           |-- user_joined ----------->|
    |                           |                           |
    |-- message("Hello") ------>|                           |
    |                           |-- message("Hello") ------>|
    |                           |                           |
    |-- leave_room ----------->|                           |
    |<-- room_left ------------|                           |
    |                           |-- user_left ------------->|
```

## 🔒 Segurança e Limitações

- **TTL Automático**: Salas expiram após 30 minutos de inatividade
- **Limpeza Automática**: Salas vazias são removidas imediatamente
- **Capacidade Limitada**: Máximo de 10 clientes por sala
- **IDs Únicos**: RoomIds são gerados criptograficamente
- **Validação**: Todas as operações são validadas no servidor

## 🚀 Como Usar

1. **Iniciar o servidor:**

   ```bash
   npm run start:dev
   ```

2. **Conectar via WebSocket:**

   ```javascript
   const ws = new WebSocket("ws://localhost:8080");
   ```

3. **Criar ou entrar em uma sala:**

   ```javascript
   // Criar sala
   ws.send(JSON.stringify({ type: "create_room" }));

   // Entrar em sala existente
   ws.send(
     JSON.stringify({
       type: "join_room",
       roomId: "ABC12345",
     })
   );
   ```

4. **Enviar mensagens:**
   ```javascript
   ws.send(
     JSON.stringify({
       type: "message",
       message: "Seus dados criptografados aqui",
     })
   );
   ```

Todas as funcionalidades solicitadas estão implementadas e testadas!
