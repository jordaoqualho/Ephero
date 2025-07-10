let backgroundWs = null;
let currentRoomId = null;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

// Store messages received while popup is closed
let pendingMessages = [];

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  switch (message.type) {
    case "WEBSOCKET_CONNECTED":
      isConnected = true;
      reconnectAttempts = 0;
      break;

    case "WEBSOCKET_DISCONNECTED":
      isConnected = false;
      break;

    case "ROOM_CREATED":
    case "ROOM_JOINED":
      currentRoomId = message.roomId;
      // Store room info for persistence
      chrome.storage.local.set({
        currentRoomId: message.roomId,
        roomCreatedAt: Date.now(),
      });
      break;

    case "ROOM_LEFT":
      currentRoomId = null;
      isConnected = false;
      chrome.storage.local.remove(["currentRoomId", "roomCreatedAt"]);
      break;

    case "SEND_MESSAGE":
      if (isConnected && backgroundWs) {
        backgroundWs.send(
          JSON.stringify({
            type: "message",
            content: message.content,
          })
        );
      }
      break;
  }
});

// Initialize background WebSocket connection
function initializeBackgroundConnection() {
  chrome.storage.local.get(["currentRoomId"], (result) => {
    if (result.currentRoomId) {
      currentRoomId = result.currentRoomId;
      connectBackgroundWebSocket();
    }
  });
}

function connectBackgroundWebSocket() {
  if (!currentRoomId) return;

  const wsUrl = `ws://localhost:3000/join/${currentRoomId}`;

  try {
    backgroundWs = new WebSocket(wsUrl);

    backgroundWs.onopen = () => {
      console.log("Background WebSocket connected");
      isConnected = true;
      reconnectAttempts = 0;
    };

    backgroundWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          // Store message for when popup opens
          const messageData = {
            content: data.content,
            timestamp: Date.now(),
          };
          pendingMessages.push(messageData);

          // Keep only last 50 messages
          if (pendingMessages.length > 50) {
            pendingMessages = pendingMessages.slice(-50);
          }

          // Show notification for new message
          showNotification("New message received", data.content);
        } else if (data.type === "error") {
          console.error("Background WebSocket error:", data.message);
        }
      } catch (error) {
        console.error("Error parsing background message:", error);
      }
    };

    backgroundWs.onclose = () => {
      console.log("Background WebSocket disconnected");
      isConnected = false;

      // Attempt to reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
          connectBackgroundWebSocket();
        }, 2000 * reconnectAttempts);
      }
    };

    backgroundWs.onerror = (error) => {
      console.error("Background WebSocket error:", error);
      isConnected = false;
    };
  } catch (error) {
    console.error("Failed to create background WebSocket:", error);
  }
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.svg",
    title: title,
    message: message,
  });
}

// Handle popup opening
chrome.action.onClicked.addListener(() => {
  // Send pending messages to popup
  if (pendingMessages.length > 0) {
    chrome.runtime.sendMessage({
      type: "PENDING_MESSAGES",
      messages: pendingMessages,
    });
    pendingMessages = [];
  }
});

// Initialize when extension loads
initializeBackgroundConnection();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  initializeBackgroundConnection();
});

chrome.runtime.onInstalled.addListener(() => {
  initializeBackgroundConnection();
});
