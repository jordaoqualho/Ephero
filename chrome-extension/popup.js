class SecureShare {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.isConnected = false;
    this.serverUrl = "ws://localhost:8080";

    this.initializeElements();
    this.bindEvents();
    this.loadStoredData();
    this.checkPendingShare();
  }

  initializeElements() {
    this.messageInput = document.getElementById("message");
    this.createRoomBtn = document.getElementById("createRoom");
    this.joinRoomBtn = document.getElementById("joinRoom");
    this.roomSection = document.getElementById("roomSection");
    this.roomIdElement = document.getElementById("roomId");
    this.copyRoomIdBtn = document.getElementById("copyRoomId");
    this.statusElement = document.getElementById("status");
    this.messagesSection = document.getElementById("messagesSection");
    this.messagesContainer = document.getElementById("messages");
  }

  bindEvents() {
    this.createRoomBtn.addEventListener("click", () => this.createRoom());
    this.joinRoomBtn.addEventListener("click", () => this.joinRoom());
    this.copyRoomIdBtn.addEventListener("click", () => this.copyRoomId());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        this.sendMessage();
      }
    });
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(["roomId", "serverUrl", "pendingShare"]);
      if (result.roomId) {
        this.roomId = result.roomId;
        this.roomIdElement.textContent = this.roomId;
        this.roomSection.style.display = "block";
      }
      if (result.serverUrl) {
        this.serverUrl = result.serverUrl;
      }
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  }

  async checkPendingShare() {
    try {
      const result = await chrome.storage.local.get(["pendingShare"]);
      if (result.pendingShare) {
        // Auto-fill the message input with selected text
        this.messageInput.value = result.pendingShare.text;
        this.showMessage(`📋 Text loaded from selection`, "System");

        // Clear the pending share
        await chrome.storage.local.remove(["pendingShare"]);
      }
    } catch (error) {
      console.error("Error checking pending share:", error);
    }
  }

  async saveStoredData() {
    try {
      await chrome.storage.local.set({
        roomId: this.roomId,
        serverUrl: this.serverUrl,
      });
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  async createRoom() {
    if (this.isConnected) {
      this.disconnect();
    }

    try {
      this.connect();
      this.ws.send(JSON.stringify({ type: "create_room" }));
    } catch (error) {
      this.showError("Failed to create room: " + error.message);
    }
  }

  async joinRoom() {
    const roomId = prompt("Enter room ID:");
    if (!roomId) return;

    if (this.isConnected) {
      this.disconnect();
    }

    try {
      this.connect();
      this.ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: roomId.trim(),
        })
      );
    } catch (error) {
      this.showError("Failed to join room: " + error.message);
    }
  }

  connect() {
    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.updateStatus("Connected", true);
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        this.updateStatus("Disconnected", false);
        this.isConnected = false;
      };

      this.ws.onerror = (error) => {
        this.showError("WebSocket error: " + error.message);
        this.updateStatus("Error", false);
        this.isConnected = false;
      };
    } catch (error) {
      this.showError("Failed to connect: " + error.message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.updateStatus("Disconnected", false);
  }

  handleMessage(data) {
    console.log("Received message:", data);

    switch (data.type) {
      case "welcome":
        this.showMessage("Connected to server");
        break;

      case "room_created":
        this.roomId = data.roomId;
        this.roomIdElement.textContent = this.roomId;
        this.roomSection.style.display = "block";
        this.messagesSection.style.display = "block";
        this.saveStoredData();
        this.showMessage("Room created successfully");
        break;

      case "room_joined":
        this.roomId = data.roomId;
        this.roomIdElement.textContent = this.roomId;
        this.roomSection.style.display = "block";
        this.messagesSection.style.display = "block";
        this.saveStoredData();
        this.showMessage("Joined room successfully");
        break;

      case "message":
        this.showMessage(data.message, data.sender || "Anonymous");
        break;

      case "error":
        this.showError(data.error);
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }

  sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message) return;

    if (!this.isConnected || !this.roomId) {
      this.showError("Not connected to a room");
      return;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type: "message",
          message: message,
        })
      );
      this.messageInput.value = "";
    } catch (error) {
      this.showError("Failed to send message: " + error.message);
    }
  }

  async copyRoomId() {
    if (!this.roomId) return;

    try {
      await navigator.clipboard.writeText(this.roomId);
      this.showMessage("Room ID copied to clipboard");
    } catch (error) {
      this.showError("Failed to copy room ID: " + error.message);
    }
  }

  updateStatus(text, connected) {
    this.statusElement.textContent = text;
    this.statusElement.className = connected ? "connected" : "";
  }

  showMessage(text, sender = "System") {
    const messageElement = document.createElement("div");
    messageElement.className = "message";
    messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showError(text) {
    console.error(text);
    this.showMessage(`❌ ${text}`, "Error");
  }
}

// Initialize the extension when the popup loads
document.addEventListener("DOMContentLoaded", () => {
  new SecureShare();
});
