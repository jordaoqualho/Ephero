let backgroundWs = null;
let currentRoomId = null;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

let pendingMessages = [];

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
      currentRoomId = message.roomId;
      chrome.storage.local.set({
        currentRoomId: message.roomId,
        roomCreatedAt: Date.now(),
      });

      if (backgroundWs && backgroundWs.readyState === WebSocket.OPEN) {
        backgroundWs.close();
      }

      setTimeout(() => {
        connectBackgroundWebSocket();
      }, 1000);
      break;

    case "ROOM_LEFT":
      currentRoomId = null;
      isConnected = false;
      chrome.storage.local.remove(["currentRoomId", "roomCreatedAt"]);

      if (backgroundWs) {
        backgroundWs.close();
        backgroundWs = null;
      }
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

  const wsUrl = `ws://localhost:4000/join/${currentRoomId}`;

  try {
    backgroundWs = new WebSocket(wsUrl);

    backgroundWs.onopen = () => {
      console.log("Background WebSocket connected to room:", currentRoomId);
      isConnected = true;
      reconnectAttempts = 0;
    };

    backgroundWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          const messageData = {
            content: data.content,
            timestamp: Date.now(),
          };
          pendingMessages.push(messageData);

          if (pendingMessages.length > 50) {
            pendingMessages = pendingMessages.slice(-50);
          }

          showNotification("New message received", data.content);
        } else if (data.type === "error") {
          console.error("Background WebSocket error:", data.message);
        } else if (data.type === "room-expired") {
          console.log("Room expired, cleaning up");
          currentRoomId = null;
          chrome.storage.local.remove(["currentRoomId", "roomCreatedAt"]);
          if (backgroundWs) {
            backgroundWs.close();
            backgroundWs = null;
          }
        }
      } catch (error) {
        console.error("Error parsing background message:", error);
      }
    };

    backgroundWs.onclose = (event) => {
      console.log("Background WebSocket disconnected:", event.code, event.reason);
      isConnected = false;

      if (reconnectAttempts < maxReconnectAttempts && currentRoomId) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(() => {
          connectBackgroundWebSocket();
        }, 2000 * reconnectAttempts);
      } else if (reconnectAttempts >= maxReconnectAttempts) {
        console.log("Max reconnection attempts reached, cleaning up");
        currentRoomId = null;
        chrome.storage.local.remove(["currentRoomId", "roomCreatedAt"]);
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
    iconUrl: "ephero.png",
    title: title,
    message: message,
  });
}

chrome.action.onClicked.addListener(() => {
  if (pendingMessages.length > 0) {
    chrome.runtime.sendMessage({
      type: "PENDING_MESSAGES",
      messages: pendingMessages,
    });
    pendingMessages = [];
  }
});

function checkRoomExpiration() {
  chrome.storage.local.get(["roomCreatedAt"], (result) => {
    if (result.roomCreatedAt) {
      const roomAge = Date.now() - result.roomCreatedAt;
      const maxRoomAge = 5 * 60 * 1000;

      if (roomAge > maxRoomAge) {
        console.log("Room expired, cleaning up");
        currentRoomId = null;
        chrome.storage.local.remove(["currentRoomId", "roomCreatedAt"]);
        if (backgroundWs) {
          backgroundWs.close();
          backgroundWs = null;
        }
      }
    }
  });
}

initializeBackgroundConnection();

chrome.runtime.onStartup.addListener(() => {
  initializeBackgroundConnection();
});

chrome.runtime.onInstalled.addListener(() => {
  initializeBackgroundConnection();
});

setInterval(checkRoomExpiration, 30000);
