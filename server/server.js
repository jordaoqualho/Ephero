const WebSocket = require("ws");
const crypto = require("crypto");

const wss = new WebSocket.Server({ port: 8080 });

// Store for ephemeral rooms
const rooms = new Map();
const clients = new Map();

// Generate a random room ID
function generateRoomId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Create a new ephemeral room
function createRoom() {
  const roomId = generateRoomId();
  const room = {
    id: roomId,
    clients: new Set(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    maxClients: 10, // Maximum clients per room
    ttl: 30 * 60 * 1000, // 30 minutes TTL
  };

  rooms.set(roomId, room);
  console.log(`Sala criada: ${roomId}`);

  // Clean up room after TTL
  setTimeout(() => {
    if (rooms.has(roomId)) {
      console.log(`Sala ${roomId} expirada e removida`);
      rooms.delete(roomId);
    }
  }, room.ttl);

  return room;
}

// Join a room
function joinRoom(roomId, client) {
  const room = rooms.get(roomId);

  if (!room) {
    return { success: false, error: "Sala não encontrada" };
  }

  if (room.clients.size >= room.maxClients) {
    return { success: false, error: "Sala cheia" };
  }

  room.clients.add(client);
  room.lastActivity = Date.now();
  clients.set(client, { roomId, joinedAt: Date.now() });

  console.log(`Cliente ${client.id} entrou na sala ${roomId}`);

  // Notify other clients in the room
  broadcastToRoom(
    roomId,
    {
      type: "user_joined",
      userId: client.id,
      timestamp: Date.now(),
    },
    client
  );

  return { success: true, room };
}

// Leave a room
function leaveRoom(client) {
  const clientInfo = clients.get(client);
  if (!clientInfo) return;

  const room = rooms.get(clientInfo.roomId);
  if (room) {
    room.clients.delete(client);
    room.lastActivity = Date.now();

    // Notify other clients
    broadcastToRoom(clientInfo.roomId, {
      type: "user_left",
      userId: client.id,
      timestamp: Date.now(),
    });

    // Remove room if empty
    if (room.clients.size === 0) {
      console.log(`Sala ${clientInfo.roomId} removida (vazia)`);
      rooms.delete(clientInfo.roomId);
    }
  }

  clients.delete(client);
  console.log(`Cliente ${client.id} saiu da sala ${clientInfo.roomId}`);
}

// Broadcast message to all clients in a room
function broadcastToRoom(roomId, message, excludeClient = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.clients.forEach((client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Handle WebSocket connections
wss.on("connection", function connection(ws) {
  // Generate unique client ID
  ws.id = crypto.randomBytes(8).toString("hex");

  console.log(`Novo cliente conectado: ${ws.id}`);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "welcome",
      clientId: ws.id,
      message: "Bem-vindo ao Ephero! Use /create para criar uma sala ou /join <roomId> para entrar em uma sala.",
    })
  );

  ws.on("message", function incoming(message) {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "create_room":
          const newRoom = createRoom();
          ws.send(
            JSON.stringify({
              type: "room_created",
              roomId: newRoom.id,
              message: `Sala ${newRoom.id} criada com sucesso!`,
            })
          );
          break;

        case "join_room":
          const result = joinRoom(data.roomId, ws);
          if (result.success) {
            ws.send(
              JSON.stringify({
                type: "room_joined",
                roomId: data.roomId,
                message: `Entrou na sala ${data.roomId}`,
                clientsCount: result.room.clients.size,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: result.error,
              })
            );
          }
          break;

        case "message":
          const clientInfo = clients.get(ws);
          if (clientInfo) {
            broadcastToRoom(
              clientInfo.roomId,
              {
                type: "message",
                userId: ws.id,
                message: data.message,
                timestamp: Date.now(),
              },
              ws
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Você precisa estar em uma sala para enviar mensagens",
              })
            );
          }
          break;

        case "leave_room":
          leaveRoom(ws);
          ws.send(
            JSON.stringify({
              type: "room_left",
              message: "Você saiu da sala",
            })
          );
          break;

        case "get_rooms":
          const activeRooms = Array.from(rooms.keys()).map((roomId) => {
            const room = rooms.get(roomId);
            return {
              id: roomId,
              clientsCount: room.clients.size,
              createdAt: room.createdAt,
            };
          });
          ws.send(
            JSON.stringify({
              type: "rooms_list",
              rooms: activeRooms,
            })
          );
          break;

        default:
          ws.send(
            JSON.stringify({
              type: "error",
              error: "Tipo de mensagem desconhecido",
            })
          );
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Erro ao processar mensagem",
        })
      );
    }
  });

  ws.on("close", function () {
    leaveRoom(ws);
    console.log(`Cliente desconectado: ${ws.id}`);
  });

  ws.on("error", function (error) {
    console.error(`Erro no cliente ${ws.id}:`, error);
    leaveRoom(ws);
  });
});

// Cleanup expired rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > room.ttl) {
      console.log(`Sala ${roomId} expirada e removida`);
      rooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

console.log("Servidor WebSocket rodando em ws://localhost:8080");
console.log("Funcionalidades disponíveis:");
console.log("- Criar sala: { type: 'create_room' }");
console.log("- Entrar em sala: { type: 'join_room', roomId: 'ABC123' }");
console.log("- Enviar mensagem: { type: 'message', message: 'texto' }");
console.log("- Sair da sala: { type: 'leave_room' }");
console.log("- Listar salas: { type: 'get_rooms' }");
