# Ephero WebSocket API

## Visão Geral

O servidor WebSocket do Ephero permite criar salas efêmeras em memória para troca segura de dados. As salas são automaticamente removidas após 30 minutos de inatividade ou quando ficam vazias.

## Conexão

Conecte-se ao servidor WebSocket em `ws://localhost:8080`

## Tipos de Mensagem

### 1. Criar Sala

**Enviar:**

```json
{
  "type": "create_room"
}
```

**Receber:**

```json
{
  "type": "room_created",
  "roomId": "ABC123",
  "message": "Sala ABC123 criada com sucesso!"
}
```

### 2. Entrar em Sala

**Enviar:**

```json
{
  "type": "join_room",
  "roomId": "ABC123"
}
```

**Receber (sucesso):**

```json
{
  "type": "room_joined",
  "roomId": "ABC123",
  "message": "Entrou na sala ABC123",
  "clientsCount": 2
}
```

**Receber (erro):**

```json
{
  "type": "error",
  "error": "Sala não encontrada"
}
```

### 3. Enviar Mensagem

**Enviar:**

```json
{
  "type": "message",
  "message": "Olá, mundo!"
}
```

**Receber (broadcast para todos na sala):**

```json
{
  "type": "message",
  "userId": "client123",
  "message": "Olá, mundo!",
  "timestamp": 1640995200000
}
```

### 4. Sair da Sala

**Enviar:**

```json
{
  "type": "leave_room"
}
```

**Receber:**

```json
{
  "type": "room_left",
  "message": "Você saiu da sala"
}
```

### 5. Listar Salas Ativas

**Enviar:**

```json
{
  "type": "get_rooms"
}
```

**Receber:**

```json
{
  "type": "rooms_list",
  "rooms": [
    {
      "id": "ABC123",
      "clientsCount": 2,
      "createdAt": 1640995200000
    }
  ]
}
```

## Eventos de Sistema

### Usuário Entrou na Sala

```json
{
  "type": "user_joined",
  "userId": "client123",
  "timestamp": 1640995200000
}
```

### Usuário Saiu da Sala

```json
{
  "type": "user_left",
  "userId": "client123",
  "timestamp": 1640995200000
}
```

### Mensagem de Boas-vindas

```json
{
  "type": "welcome",
  "clientId": "client123",
  "message": "Bem-vindo ao Ephero! Use /create para criar uma sala ou /join <roomId> para entrar em uma sala."
}
```

### Erro

```json
{
  "type": "error",
  "error": "Descrição do erro"
}
```

## Limitações

- **Máximo de clientes por sala**: 10
- **TTL da sala**: 30 minutos de inatividade
- **Limpeza automática**: A cada 5 minutos
- **IDs de sala**: 8 caracteres hexadecimais (ex: ABC12345)

## Exemplo de Uso

```javascript
const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("Conectado ao servidor");

  // Criar uma sala
  ws.send(JSON.stringify({ type: "create_room" }));
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  console.log("Recebido:", message);
});

ws.on("close", () => {
  console.log("Desconectado do servidor");
});
```

## Teste

Execute o cliente de teste incluído:

```bash
cd server
npm run test:client
```

Ou execute diretamente:

```bash
node test-client.js
```
