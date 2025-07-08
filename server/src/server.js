const WebSocket = require("ws");
const RoomService = require("./services/RoomService");
const ClientService = require("./services/ClientService");
const MessageHandler = require("./services/MessageHandler");

class EpheroServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.roomService = new RoomService();
    this.clientService = new ClientService();
    this.messageHandler = new MessageHandler(this.roomService, this.clientService);
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    this.setupEventHandlers();
    this.startCleanupInterval();
    this.logServerStart();
  }

  setupEventHandlers() {
    this.wss.on("connection", (ws) => {
      const client = this.clientService.createClient(ws);
      this.setupClientHandlers(client);
      this.clientService.sendWelcomeMessage(client);
    });
  }

  setupClientHandlers(client) {
    client.ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.messageHandler.handleMessage(client, message);
      } catch (error) {
        client.send({
          type: "error",
          error: "Erro ao processar mensagem",
        });
      }
    });

    client.ws.on("close", () => {
      this.handleClientDisconnect(client);
    });

    client.ws.on("error", (error) => {
      this.handleClientError(client, error);
    });
  }

  handleClientDisconnect(client) {
    this.roomService.removeClientFromRoom(client);
    this.clientService.removeClient(client.id);
  }

  handleClientError(client, error) {
    this.handleClientDisconnect(client);
  }

  startCleanupInterval() {
    setInterval(() => {
      this.roomService.cleanupExpiredRooms();
    }, 5 * 60 * 1000);
  }

  logServerStart() {
    console.log(`Servidor WebSocket rodando em ws://localhost:${this.port}`);
    console.log("Funcionalidades disponíveis:");
    console.log("- Criar sala: { type: 'create_room' }");
    console.log("- Entrar em sala: { type: 'join_room', roomId: 'ABC123' }");
    console.log("- Enviar mensagem: { type: 'message', message: 'texto' }");
    console.log("- Sair da sala: { type: 'leave_room' }");
    console.log("- Listar salas: { type: 'get_rooms' }");
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = EpheroServer;
