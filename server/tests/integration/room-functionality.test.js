const WebSocket = require("ws");

class RoomFunctionalityTest {
  constructor() {
    this.clients = [];
    this.roomId = null;
  }

  async runTest() {
    console.log("🧪 Testing room functionality...\n");

    try {
      await this.testCreateRoom();
      await this.testJoinRoom();
      await this.testBroadcasting();
      await this.testClientTracking();
      await this.testLeaveRoom();

      console.log("\n✅ All tests passed!");
    } catch (error) {
      console.error("\n❌ Test failed:", error.message);
    } finally {
      this.cleanup();
    }
  }

  createClient(name) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("ws://localhost:8080");
      const client = { ws, name, messages: [] };

      ws.on("open", () => {
        console.log(`[${name}] Connected`);
        resolve(client);
      });

      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        client.messages.push(message);
        console.log(`[${name}] Received: ${message.type}`);
      });

      ws.on("error", reject);
      ws.on("close", () => console.log(`[${name}] Disconnected`));

      client.send = (data) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(data));
        }
      };

      client.waitForMessage = (type, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for message ${type}`));
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
    console.log("📝 Test 1: Create room");

    const client1 = await this.createClient("Client1");
    this.clients.push(client1);

    client1.send({ type: "create_room" });
    const response = await client1.waitForMessage("room_created");

    this.roomId = response.roomId;
    console.log(`✅ Room created: ${this.roomId}\n`);
  }

  async testJoinRoom() {
    console.log("🚪 Test 2: Join existing room by roomId");

    const client2 = await this.createClient("Client2");
    this.clients.push(client2);

    client2.send({ type: "join_room", roomId: this.roomId });
    const response = await client2.waitForMessage("room_joined");

    if (response.roomId === this.roomId && response.clientsCount === 2) {
      console.log("✅ Client2 successfully joined the room");
    } else {
      throw new Error("Failed to join room");
    }
    console.log("");
  }

  async testBroadcasting() {
    console.log("📡 Test 3: Message broadcasting");

    const client3 = await this.createClient("Client3");
    this.clients.push(client3);

    client3.send({ type: "join_room", roomId: this.roomId });
    await client3.waitForMessage("room_joined");

    const testMessage = "Hello, this is a test message!";
    client3.send({ type: "message", message: testMessage });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const client1 = this.clients[0];
    const client2 = this.clients[1];

    const client1Received = client1.messages.some((m) => m.type === "message" && m.message === testMessage);
    const client2Received = client2.messages.some((m) => m.type === "message" && m.message === testMessage);

    if (client1Received && client2Received) {
      console.log("✅ Broadcasting working: all clients received the message");
    } else {
      throw new Error("Broadcasting failed");
    }
    console.log("");
  }

  async testClientTracking() {
    console.log("👥 Test 4: Client tracking in room");

    const client4 = await this.createClient("Client4");
    this.clients.push(client4);

    client4.send({ type: "join_room", roomId: this.roomId });
    const response = await client4.waitForMessage("room_joined");

    if (response.clientsCount === 4) {
      console.log("✅ Client tracking working: 4 clients in room");
    } else {
      throw new Error(`Expected 4 clients, found ${response.clientsCount}`);
    }

    const client1 = this.clients[0];
    const joinNotifications = client1.messages.filter((m) => m.type === "user_joined");

    if (joinNotifications.length >= 3) {
      console.log("✅ Join notifications working");
    } else {
      throw new Error("Join notifications not working");
    }
    console.log("");
  }

  async testLeaveRoom() {
    console.log("👋 Test 5: Leave room");

    const clientToLeave = this.clients[1];
    clientToLeave.send({ type: "leave_room" });

    await clientToLeave.waitForMessage("room_left");

    const otherClient = this.clients[0];
    const leaveNotification = otherClient.messages.find((m) => m.type === "user_left");

    if (leaveNotification) {
      console.log("✅ Leave notification working");
    } else {
      throw new Error("Leave notification not working");
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
