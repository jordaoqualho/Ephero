let ws = null;
let roomId = null;
let isConnected = false;
let ttlInterval = null;
let timeLeft = 300;

const elements = {
  message: document.getElementById("message"),
  sendMessage: document.getElementById("sendMessage"),
  createRoom: document.getElementById("createRoom"),
  joinRoom: document.getElementById("joinRoom"),
  roomActions: document.getElementById("roomActions"),
  roomSection: document.getElementById("roomSection"),
  roomId: document.getElementById("roomId"),
  copyRoomId: document.getElementById("copyRoomId"),
  ttlTimer: document.getElementById("ttlTimer"),
  timer: document.getElementById("timer"),
  status: document.getElementById("status"),
  leaveRoom: document.getElementById("leaveRoom"),
  messagesSection: document.getElementById("messagesSection"),
  messages: document.getElementById("messages"),
  clearMessages: document.getElementById("clearMessages"),
  inputSection: document.getElementById("inputSection"),
  connectionInfo: document.getElementById("connectionInfo"),
};

function updateStatus(status, className = "") {
  elements.status.textContent = status;
  elements.status.className = className;
}

function updateConnectionInfo(info) {
  elements.connectionInfo.textContent = info;
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error";
  errorDiv.textContent = message;
  document.querySelector(".container").insertBefore(errorDiv, document.querySelector("main"));
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success";
  successDiv.textContent = message;
  document.querySelector(".container").insertBefore(successDiv, document.querySelector("main"));
  setTimeout(() => successDiv.remove(), 3000);
}

function updateSendButton() {
  const hasMessage = elements.message.value.trim().length > 0;
  const canSend = hasMessage && isConnected;
  elements.sendMessage.disabled = !canSend;
}

function addMessage(content, type = "received", timestamp = new Date()) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = content;

  const timeDiv = document.createElement("div");
  timeDiv.className = "message-time";
  timeDiv.textContent = timestamp.toLocaleTimeString();

  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timeDiv);

  elements.messages.appendChild(messageDiv);
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function clearMessages() {
  elements.messages.innerHTML = "";
}

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  elements.timer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  if (timeLeft <= 0) {
    clearInterval(ttlInterval);
    leaveRoom();
    showError("Room has expired");
  }
}

function startTimer() {
  timeLeft = 300;
  updateTimer();
  elements.ttlTimer.style.display = "flex";
  ttlInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (ttlInterval) {
    clearInterval(ttlInterval);
    ttlInterval = null;
  }
  elements.ttlTimer.style.display = "none";
}

function showRoomInterface() {
  elements.roomSection.style.display = "block";
  elements.messagesSection.style.display = "flex";
  elements.inputSection.style.display = "block";
  elements.roomActions.style.display = "none";
}

function hideRoomInterface() {
  elements.roomSection.style.display = "none";
  elements.messagesSection.style.display = "none";
  elements.inputSection.style.display = "none";
  elements.roomActions.style.display = "flex";
}

function connectWebSocket(roomIdToJoin = null) {
  const wsUrl = roomIdToJoin ? `ws://localhost:3000/join/${roomIdToJoin}` : "ws://localhost:3000/create";

  try {
    ws = new WebSocket(wsUrl);
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    showError("Failed to create connection");
    return;
  }

  updateStatus("Connecting...", "connecting");
  updateConnectionInfo("Establishing connection...");

  ws.onopen = () => {
    isConnected = true;
    updateStatus("Connected", "connected");
    updateSendButton();
    updateConnectionInfo("Connected to room");
    showSuccess("Connected to room successfully");

    // Notify service worker about connection
    chrome.runtime.sendMessage({
      type: "WEBSOCKET_CONNECTED",
      roomId: roomIdToJoin,
    });
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "room_created") {
        roomId = data.roomId;
        elements.roomId.textContent = roomId;
        showRoomInterface();
        startTimer();
        showSuccess("Room created successfully");
        updateConnectionInfo(`Room: ${roomId}`);

        // Store room info in service worker
        chrome.runtime.sendMessage({
          type: "ROOM_CREATED",
          roomId: roomId,
        });
      } else if (data.type === "room_joined") {
        roomId = data.roomId;
        elements.roomId.textContent = roomId;
        showRoomInterface();
        startTimer();
        showSuccess("Joined room successfully");
        updateConnectionInfo(`Room: ${roomId}`);

        // Store room info in service worker
        chrome.runtime.sendMessage({
          type: "ROOM_JOINED",
          roomId: roomId,
        });
      } else if (data.type === "message") {
        addMessage(data.content, "received");
      } else if (data.type === "error") {
        showError(data.message);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };

  ws.onclose = () => {
    isConnected = false;
    updateStatus("Disconnected");
    updateSendButton();
    stopTimer();
    updateConnectionInfo("Connection lost");

    // Notify service worker about disconnection
    chrome.runtime.sendMessage({
      type: "WEBSOCKET_DISCONNECTED",
    });
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    showError("Connection failed - check if server is running");
    updateStatus("Error");
    isConnected = false;
    updateSendButton();
    updateConnectionInfo("Connection failed");
  };
}

function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnected = false;
  updateStatus("Disconnected");
  updateSendButton();
}

function leaveRoom() {
  disconnectWebSocket();
  stopTimer();
  roomId = null;
  hideRoomInterface();
  clearMessages();
  elements.message.value = "";
  updateSendButton();
  updateConnectionInfo("Click Create Room or Join Room to start");

  // Notify service worker about leaving room
  chrome.runtime.sendMessage({
    type: "ROOM_LEFT",
  });
}

function sendMessage() {
  const message = elements.message.value.trim();
  if (!message || !isConnected) return;

  const messageData = {
    type: "message",
    content: message,
  };

  ws.send(JSON.stringify(messageData));
  addMessage(message, "sent");
  elements.message.value = "";
  updateSendButton();
}

function copyRoomId() {
  navigator.clipboard
    .writeText(roomId)
    .then(() => {
      showSuccess("Room ID copied to clipboard");
    })
    .catch(() => {
      showError("Failed to copy room ID");
    });
}

// Event listeners
elements.message.addEventListener("input", updateSendButton);
elements.sendMessage.addEventListener("click", sendMessage);
elements.message.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

elements.createRoom.addEventListener("click", () => {
  connectWebSocket();
});

elements.joinRoom.addEventListener("click", () => {
  const roomIdToJoin = prompt("Enter room ID:");
  if (roomIdToJoin && roomIdToJoin.trim()) {
    connectWebSocket(roomIdToJoin.trim());
  }
});

elements.copyRoomId.addEventListener("click", copyRoomId);
elements.leaveRoom.addEventListener("click", leaveRoom);
elements.clearMessages.addEventListener("click", clearMessages);

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_MESSAGE") {
    addMessage(message.content, "received", new Date(message.timestamp));
  } else if (message.type === "ROOM_EXPIRED") {
    leaveRoom();
    showError("Room has expired");
  } else if (message.type === "PENDING_MESSAGES") {
    // Add pending messages when popup opens
    message.messages.forEach((msg) => {
      addMessage(msg.content, "received", new Date(msg.timestamp));
    });
  }
});

// Initialize
updateSendButton();
updateConnectionInfo("Click Create Room or Join Room to start");
