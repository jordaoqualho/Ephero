class BackgroundService {
  constructor() {
    this.backgroundWs = null;
    this.currentRoomId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.pendingMessages = [];

    this.initializeMessageListener();
    this.initializeEventListeners();
    this.initializeBackgroundConnection();
  }

  initializeMessageListener() {
    chrome.runtime.onMessage.addListener((message) => this.handleMessage(message));
  }

  initializeEventListeners() {
    chrome.action.onClicked.addListener(() => this.handlePopupOpen());
    chrome.runtime.onStartup.addListener(() => this.initializeBackgroundConnection());
    chrome.runtime.onInstalled.addListener(() => this.initializeBackgroundConnection());
  }

  handleMessage(message) {
    console.log("Background received message:", message);

    const handlers = {
      WEBSOCKET_CONNECTED: () => this.handleWebSocketConnected(),
      WEBSOCKET_DISCONNECTED: () => this.handleWebSocketDisconnected(),
      ROOM_CREATED: (roomId) => this.handleRoomCreated(roomId),
      ROOM_LEFT: () => this.handleRoomLeft(),
      SEND_MESSAGE: (content) => this.handleSendMessage(content),
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(message.roomId || message.content);
    }
  }

  handleWebSocketConnected() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
  }

  handleWebSocketDisconnected() {
    this.isConnected = false;
  }

  handleRoomCreated(roomId) {
    this.currentRoomId = roomId;
    this.persistRoomData(roomId);
    this.reconnectToRoom();
  }

  handleRoomLeft() {
    this.currentRoomId = null;
    this.isConnected = false;
    this.clearRoomData();
    this.closeWebSocket();
  }

  handleSendMessage(content) {
    if (this.isConnected && this.backgroundWs && this.backgroundWs.readyState === WebSocket.OPEN) {
      try {
        this.backgroundWs.send(
          JSON.stringify({
            type: "message",
            content: content,
          })
        );
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  }

  persistRoomData(roomId) {
    chrome.storage.local.set({
      currentRoomId: roomId,
      roomCreatedAt: Date.now(),
    });
  }

  clearRoomData() {
    chrome.storage.local.remove(["currentRoomId", "roomCreatedAt"]);
  }

  closeWebSocket() {
    if (this.backgroundWs) {
      this.backgroundWs.close();
      this.backgroundWs = null;
    }
  }

  reconnectToRoom() {
    if (this.backgroundWs && this.backgroundWs.readyState === WebSocket.OPEN) {
      this.backgroundWs.close();
    }

    setTimeout(() => {
      this.connectBackgroundWebSocket();
    }, 1000);
  }

  initializeBackgroundConnection() {
    chrome.storage.local.get(["currentRoomId"], (result) => {
      if (result.currentRoomId) {
        this.currentRoomId = result.currentRoomId;
        this.connectBackgroundWebSocket();
      }
    });
  }

  connectBackgroundWebSocket() {
    if (!this.currentRoomId) {
      console.log("No room ID available for background connection");
      return;
    }

    const wsUrl = `ws://localhost:4000/join/${this.currentRoomId}`;
    console.log("Attempting to connect to:", wsUrl);

    try {
      this.closeWebSocket();
      this.backgroundWs = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error("Failed to create background WebSocket:", error);
      this.isConnected = false;
    }
  }

  setupWebSocketHandlers() {
    this.backgroundWs.onopen = () => this.handleBackgroundWebSocketOpen();
    this.backgroundWs.onmessage = (event) => this.handleBackgroundWebSocketMessage(event);
    this.backgroundWs.onclose = (event) => this.handleBackgroundWebSocketClose(event);
    this.backgroundWs.onerror = (error) => this.handleBackgroundWebSocketError(error);
  }

  handleBackgroundWebSocketOpen() {
    console.log("Background WebSocket connected to room:", this.currentRoomId);
    this.isConnected = true;
    this.reconnectAttempts = 0;
  }

  handleBackgroundWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log("Background received message:", data);
      this.processBackgroundMessage(data);
    } catch (error) {
      console.error("Error parsing background message:", error);
    }
  }

  processBackgroundMessage(data) {
    const handlers = {
      message: (content) => this.handleBackgroundMessage(content),
      error: (message) => console.error("Background WebSocket error:", message || "Unknown error"),
      "room-expired": () => this.handleRoomExpired(),
    };

    const handler = handlers[data.type];
    if (handler) {
      handler(data.content || data.message);
    }
  }

  handleBackgroundMessage(content) {
    const messageData = {
      content: content,
      timestamp: Date.now(),
    };
    this.pendingMessages.push(messageData);

    if (this.pendingMessages.length > 50) {
      this.pendingMessages = this.pendingMessages.slice(-50);
    }

    this.showNotification("New message received", content);
  }

  handleRoomExpired() {
    console.log("Room expired, cleaning up");
    this.currentRoomId = null;
    this.clearRoomData();
    this.closeWebSocket();
  }

  handleBackgroundWebSocketClose(event) {
    console.log("Background WebSocket disconnected:", event.code, event.reason);
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.currentRoomId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connectBackgroundWebSocket();
      }, 2000 * this.reconnectAttempts);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached, cleaning up");
      this.currentRoomId = null;
      this.clearRoomData();
    }
  }

  handleBackgroundWebSocketError(error) {
    console.error("Background WebSocket error:", error);
    this.isConnected = false;
  }

  handlePopupOpen() {
    if (this.pendingMessages.length > 0) {
      chrome.runtime.sendMessage({
        type: "PENDING_MESSAGES",
        messages: this.pendingMessages,
      });
      this.pendingMessages = [];
    }
  }

  showNotification(title, message) {
    try {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "ephero.png",
        title: title,
        message: message,
      });
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }

  checkRoomExpiration() {
    chrome.storage.local.get(["roomCreatedAt"], (result) => {
      if (result.roomCreatedAt) {
        const roomAge = Date.now() - result.roomCreatedAt;
        const maxRoomAge = 5 * 60 * 1000;

        if (roomAge > maxRoomAge) {
          console.log("Room expired, cleaning up");
          this.currentRoomId = null;
          this.clearRoomData();
          this.closeWebSocket();
        }
      }
    });
  }
}

const backgroundService = new BackgroundService();
setInterval(() => backgroundService.checkRoomExpiration(), 30000);
