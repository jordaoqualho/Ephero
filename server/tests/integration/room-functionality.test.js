const WebSocket = require("ws");

class RoomFunctionalityTest {
  constructor() {
    this.clients = [];
    this.roomId = null;
  }

  createClient(name) {
    const mockWs = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
    };

    const client = {
      ws: mockWs,
      name,
      messages: [],
      send: (data) => {
        if (mockWs.readyState === 1) {
          mockWs.send(JSON.stringify(data));
        }
      },
      waitForMessage: (type, timeout = 5000) => {
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
      },
    };

    return Promise.resolve(client);
  }

  cleanup() {
    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.ws.close();
      }
    });
  }
}

describe("Room Functionality Integration Tests", () => {
  let testInstance;

  beforeEach(() => {
    testInstance = new RoomFunctionalityTest();
  });

  afterEach(() => {
    if (testInstance) {
      testInstance.cleanup();
    }
  });

  test("should create test instance", () => {
    expect(testInstance.clients).toEqual([]);
    expect(testInstance.roomId).toBeNull();
  });

  test("should create client with correct properties", async () => {
    const client = await testInstance.createClient("TestClient");
    expect(client.name).toBe("TestClient");
    expect(client.messages).toEqual([]);
    expect(typeof client.send).toBe("function");
    expect(typeof client.waitForMessage).toBe("function");
  });

  test("should handle message waiting correctly", async () => {
    const client = await testInstance.createClient("TestClient");

    setTimeout(() => {
      client.messages.push({ type: "test_message", data: "test" });
    }, 100);

    const message = await client.waitForMessage("test_message");
    expect(message.type).toBe("test_message");
  });

  test("should cleanup clients properly", async () => {
    const client = await testInstance.createClient("TestClient");
    testInstance.clients = [client];
    testInstance.cleanup();

    expect(client.ws.close).toHaveBeenCalled();
  });
});

module.exports = RoomFunctionalityTest;
