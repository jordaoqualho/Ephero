const WebSocket = require("ws");

class EpheroTestClient {
  constructor(name) {
    this.name = name;
    this.ws = null;
    this.roomId = null;
  }

  connect() {
    this.ws = new WebSocket("ws://localhost:8080");

    this.ws.on("open", () => {
      console.log(`[${this.name}] Conectado ao servidor`);
    });

    this.ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });

    this.ws.on("close", () => {
      console.log(`[${this.name}] Desconectado do servidor`);
    });

    this.ws.on("error", (error) => {
      console.error(`[${this.name}] Erro:`, error);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case "welcome":
        console.log(`[${this.name}] ${message.message}`);
        console.log(`[${this.name}] Client ID: ${message.clientId}`);
        break;

      case "room_created":
        this.roomId = message.roomId;
        console.log(`[${this.name}] ${message.message}`);
        break;

      case "room_joined":
        this.roomId = message.roomId;
        console.log(`[${this.name}] ${message.message} (${message.clientsCount} usuários na sala)`);
        break;

      case "room_left":
        this.roomId = null;
        console.log(`[${this.name}] ${message.message}`);
        break;

      case "message":
        console.log(`[${this.name}] Mensagem de ${message.userId}: ${message.message}`);
        break;

      case "user_joined":
        console.log(`[${this.name}] Usuário ${message.userId} entrou na sala`);
        break;

      case "user_left":
        console.log(`[${this.name}] Usuário ${message.userId} saiu da sala`);
        break;

      case "rooms_list":
        console.log(`[${this.name}] Salas ativas:`, message.rooms);
        break;

      case "error":
        console.error(`[${this.name}] Erro: ${message.error}`);
        break;

      default:
        console.log(`[${this.name}] Mensagem desconhecida:`, message);
    }
  }

  createRoom() {
    this.send({ type: "create_room" });
  }

  joinRoom(roomId) {
    this.send({ type: "join_room", roomId });
  }

  sendMessage(text) {
    this.send({ type: "message", message: text });
  }

  leaveRoom() {
    this.send({ type: "leave_room" });
  }

  getRooms() {
    this.send({ type: "get_rooms" });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error(`[${this.name}] WebSocket não está conectado`);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Example usage
if (require.main === module) {
  console.log("=== Cliente de Teste Ephero ===");
  console.log("Comandos disponíveis:");
  console.log("1. create - Criar uma nova sala");
  console.log("2. join <roomId> - Entrar em uma sala");
  console.log("3. message <text> - Enviar mensagem");
  console.log("4. leave - Sair da sala");
  console.log("5. rooms - Listar salas ativas");
  console.log("6. quit - Sair do cliente");
  console.log("");

  const client = new EpheroTestClient("TestClient");
  client.connect();

  // Simple command line interface
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    const parts = input.trim().split(" ");
    const command = parts[0];

    switch (command) {
      case "create":
        client.createRoom();
        break;

      case "join":
        if (parts[1]) {
          client.joinRoom(parts[1]);
        } else {
          console.log("Uso: join <roomId>");
        }
        break;

      case "message":
        if (parts[1]) {
          const message = parts.slice(1).join(" ");
          client.sendMessage(message);
        } else {
          console.log("Uso: message <text>");
        }
        break;

      case "leave":
        client.leaveRoom();
        break;

      case "rooms":
        client.getRooms();
        break;

      case "quit":
        client.disconnect();
        rl.close();
        process.exit(0);
        break;

      default:
        console.log("Comando desconhecido. Use: create, join, message, leave, rooms, ou quit");
    }
  });
}

module.exports = EpheroTestClient;
