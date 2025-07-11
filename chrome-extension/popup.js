let ws = null;
let isConnected = false;
let currentAESKey = null;

const elements = {
  sensitiveText: document.getElementById("sensitiveText"),
  shareSecurely: document.getElementById("shareSecurely"),
  shareSection: document.getElementById("shareSection"),
  resultSection: document.getElementById("resultSection"),
  secureLink: document.getElementById("secureLink"),
  copyLink: document.getElementById("copyLink"),
  shareAgain: document.getElementById("shareAgain"),
  status: document.getElementById("status"),
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

// Generate a random AES key
function generateAESKey() {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Encrypt text with AES-GCM
async function encryptText(text, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, cryptoKey, data);

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined);
}

// Decrypt text with AES-GCM
async function decryptText(encryptedData, key) {
  const combined = base64ToArrayBuffer(encryptedData);
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["decrypt"]);

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, cryptoKey, encrypted);

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

function connectWebSocket() {
  try {
    ws = new WebSocket("ws://localhost:8080");
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
    updateConnectionInfo("Connected to server");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    } catch (error) {
      console.error("Error parsing message:", error);
      showError("Invalid server response");
    }
  };

  ws.onclose = () => {
    isConnected = false;
    updateStatus("Disconnected");
    updateConnectionInfo("Connection lost");
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    showError("Connection failed - check if server is running");
    updateStatus("Error");
    isConnected = false;
    updateConnectionInfo("Connection failed");
  };
}

function handleServerMessage(data) {
  if (data.type === "room-created") {
    handleRoomCreated(data.roomId);
  } else if (data.type === "data-stored") {
    handleDataStored(data.roomId);
  } else if (data.type === "error") {
    showError(data.message || "Server error");
  }
}

async function handleRoomCreated(roomId) {
  const text = elements.sensitiveText.value.trim();
  if (!text) {
    showError("Please enter some text to share");
    return;
  }

  // Generate AES key and encrypt the text
  currentAESKey = generateAESKey();
  const encryptedText = await encryptText(text, currentAESKey);

  // Send encrypted data to server
  const message = {
    type: "send-data",
    roomId: roomId,
    payload: encryptedText,
  };

  ws.send(JSON.stringify(message));
}

function handleDataStored(roomId) {
  // Generate the secure link with roomId and AES key
  const keyBase64 = arrayBufferToBase64(currentAESKey);
  const secureLink = `https://myapp.com/#${roomId}:${keyBase64}`;

  // Display the result
  elements.secureLink.value = secureLink;
  elements.shareSection.style.display = "none";
  elements.resultSection.style.display = "block";

  // Copy to clipboard
  copyToClipboard(secureLink);

  updateStatus("Success", "success");
  updateConnectionInfo("Secure link generated and copied to clipboard");
  showSuccess("Link copied!");
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess("Link copied to clipboard!");
    })
    .catch(() => {
      showError("Failed to copy link");
    });
}

function resetForm() {
  elements.sensitiveText.value = "";
  elements.shareSection.style.display = "block";
  elements.resultSection.style.display = "none";
  updateStatus("Ready");
  updateConnectionInfo("Enter text and click Share Securely to create a secure link");
}

async function shareSecurely() {
  const text = elements.sensitiveText.value.trim();
  if (!text) {
    showError("Please enter some text to share");
    return;
  }

  if (!isConnected) {
    connectWebSocket();
    // Wait a bit for connection to establish
    setTimeout(() => {
      if (isConnected) {
        shareSecurely();
      } else {
        showError("Failed to connect to server");
      }
    }, 1000);
    return;
  }

  updateStatus("Creating secure room...", "connecting");
  updateConnectionInfo("Creating secure room...");

  // Send create-room message
  const message = {
    type: "create-room",
  };

  ws.send(JSON.stringify(message));
}

// Event listeners
elements.shareSecurely.addEventListener("click", shareSecurely);
elements.copyLink.addEventListener("click", () => {
  copyToClipboard(elements.secureLink.value);
});
elements.shareAgain.addEventListener("click", resetForm);

// Initialize
updateStatus("Ready");
updateConnectionInfo("Enter text and click Share Securely to create a secure link");
