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
};

function updateStatus(status, className = "") {
  elements.status.textContent = status;
  elements.status.className = className;
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
  elements.ttlTimer.style.display = "block";
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

  ws.onopen = () => {
    isConnected = true;
    updateStatus("Connected", "connected");
    updateSendButton();
    showSuccess("Connected to room successfully");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "room_created") {
        roomId = data.roomId;
        elements.roomId.textContent = roomId;
        elements.roomSection.style.display = "block";
        elements.roomActions.style.display = "none";
        elements.messagesSection.style.display = "block";
        startTimer();
        showSuccess("Room created successfully");
      } else if (data.type === "room_joined") {
        roomId = data.roomId;
        elements.roomId.textContent = roomId;
        elements.roomSection.style.display = "block";
        elements.roomActions.style.display = "none";
        elements.messagesSection.style.display = "block";
        startTimer();
        showSuccess("Joined room successfully");
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
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    showError("Connection failed - check if server is running");
    updateStatus("Error");
    isConnected = false;
    updateSendButton();
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
  elements.roomSection.style.display = "none";
  elements.roomActions.style.display = "flex";
  elements.messagesSection.style.display = "none";
  clearMessages();
  elements.message.value = "";
  updateSendButton();
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

updateSendButton();
