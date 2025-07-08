const WebSocket = require("ws");

class RoomFunctionalityTest {
  constructor() {
    this.clients = [];
    this.roomId = null;
  }

  async runTest() {
    console.log("🧪 Testando funcionalidades de sala...\n");

    try {
      await this.testCreateRoom();
      await this.testJoinRoom();
      await this.testBroadcasting();
      await this.testClientTracking();
      await this.testLeaveRoom();

      console.log("\n✅ Todos os testes passaram!");
    } catch (error) {
      console.error("\n❌ Teste falhou:", error.message);
    } finally {
      this.cleanup();
    }
  }

  createClient(name) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("ws://localhost:8080");
      const client = { ws, name, messages: [] };

      ws.on("open", () => {
        console.log(`[${name}] Conectado`);
        resolve(client);
      });

      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        client.messages.push(message);
        console.log(`[${name}] Recebeu: ${message.type}`);
      });

      ws.on("error", reject);
      ws.on("close", () => console.log(`[${name}] Desconectado`));

      client.send = (data) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(data));
        }
      };

      client.waitForMessage = (type, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Timeout esperando mensagem ${type}`));
          }, timeout);

          const checkMessage = () => {
            const message = client.messages.find((m) => m.type === type);
            if (message) {
              clearTimeout(timer);
              resolve(message);
            } else {
              setTimeout(checkMessage, 100);
            }
          };
          checkMessage();
        });
      };
    });
  }

  async testCreateRoom() {
    console.log("📝 Teste 1: Criar sala");

    const client1 = await this.createClient("Cliente1");
    this.clients.push(client1);

    client1.send({ type: "create_room" });
    const response = await client1.waitForMessage("room_created");

    this.roomId = response.roomId;
    console.log(`✅ Sala criada: ${this.roomId}\n`);
  }

  async testJoinRoom() {
    console.log("🚪 Teste 2: Entrar em sala existente por roomId");

    const client2 = await this.createClient("Cliente2");
    this.clients.push(client2);

    client2.send({ type: "join_room", roomId: this.roomId });
    const response = await client2.waitForMessage("room_joined");

    if (response.roomId === this.roomId && response.clientsCount === 2) {
      console.log("✅ Cliente2 entrou na sala com sucesso");
    } else {
      throw new Error("Falha ao entrar na sala");
    }
    console.log("");
  }

  async testBroadcasting() {
    console.log("📡 Teste 3: Broadcasting de mensagens");

    const client3 = await this.createClient("Cliente3");
    this.clients.push(client3);

    client3.send({ type: "join_room", roomId: this.roomId });
    await client3.waitForMessage("room_joined");

    const testMessage = "Olá, esta é uma mensagem de teste!";
    client3.send({ type: "message", message: testMessage });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const client1 = this.clients[0];
    const client2 = this.clients[1];

    const client1Received = client1.messages.some((m) => m.type === "message" && m.message === testMessage);
    const client2Received = client2.messages.some((m) => m.type === "message" && m.message === testMessage);

    if (client1Received && client2Received) {
      console.log("✅ Broadcasting funcionando: todos os clientes receberam a mensagem");
    } else {
      throw new Error("Broadcasting falhou");
    }
    console.log("");
  }

  async testClientTracking() {
    console.log("👥 Teste 4: Rastreamento de clientes na sala");

    const client4 = await this.createClient("Cliente4");
    this.clients.push(client4);

    client4.send({ type: "join_room", roomId: this.roomId });
    const response = await client4.waitForMessage("room_joined");

    if (response.clientsCount === 4) {
      console.log("✅ Rastreamento de clientes funcionando: 4 clientes na sala");
    } else {
      throw new Error(`Esperado 4 clientes, encontrado ${response.clientsCount}`);
    }

    const client1 = this.clients[0];
    const joinNotifications = client1.messages.filter((m) => m.type === "user_joined");

    if (joinNotifications.length >= 3) {
      console.log("✅ Notificações de entrada funcionando");
    } else {
      throw new Error("Notificações de entrada não estão funcionando");
    }
    console.log("");
  }

  async testLeaveRoom() {
    console.log("👋 Teste 5: Sair da sala");

    const clientToLeave = this.clients[1];
    clientToLeave.send({ type: "leave_room" });

    await clientToLeave.waitForMessage("room_left");

    const otherClient = this.clients[0];
    const leaveNotification = otherClient.messages.find((m) => m.type === "user_left");

    if (leaveNotification) {
      console.log("✅ Notificação de saída funcionando");
    } else {
      throw new Error("Notificação de saída não está funcionando");
    }
    console.log("");
  }

  cleanup() {
    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.ws.close();
      }
    });
  }
}

if (require.main === module) {
  const test = new RoomFunctionalityTest();
  test.runTest();
}

module.exports = RoomFunctionalityTest;
