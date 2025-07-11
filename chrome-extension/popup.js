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
  openLink: document.getElementById("openLink"),
  shareAgain: document.getElementById("shareAgain"),
  status: document.getElementById("status"),
  connectionInfo: document.getElementById("connectionInfo"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toastMessage"),
};

const updateStatus = (status, className = "") => {
  elements.status.textContent = status;
  elements.status.className = `text-xs font-medium px-3 py-1 rounded-full ${className}`;
};

const updateConnectionInfo = (info) => {
  elements.connectionInfo.textContent = info;
};

const showToast = (message, type = "info") => {
  const toast = elements.toast;
  const toastMessage = elements.toastMessage;

  toastMessage.textContent = message;

  toast.classList.remove("bg-gray-800", "bg-green-600", "bg-red-600");

  switch (type) {
    case "success":
      toast.classList.add("bg-green-600");
      break;
    case "error":
      toast.classList.add("bg-red-600");
      break;
    default:
      toast.classList.add("bg-gray-800");
  }

  toast.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");
  toast.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
  }, 2000);
};

const generateAESKey = () => crypto.getRandomValues(new Uint8Array(32));

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const encryptText = async (text, key) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, cryptoKey, data);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined);
};

const connectWebSocket = () => {
  try {
    ws = new WebSocket("ws://localhost:4000");
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    showToast("Failed to create connection", "error");
    return;
  }

  updateStatus("Connecting...", "bg-yellow-600 text-yellow-100");
  updateConnectionInfo("Establishing connection...");

  ws.onopen = () => {
    isConnected = true;
    updateStatus("Connected", "bg-green-600 text-green-100");
    updateConnectionInfo("Connected to server");

    chrome.runtime.sendMessage({
      type: "WEBSOCKET_CONNECTED",
    });
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    } catch (error) {
      console.error("Error parsing message:", error);
      showToast("Invalid server response", "error");
    }
  };

  ws.onclose = () => {
    isConnected = false;
    updateStatus("Disconnected", "bg-gray-700 text-gray-300");
    updateConnectionInfo("Connection lost");

    chrome.runtime.sendMessage({
      type: "WEBSOCKET_DISCONNECTED",
    });
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    showToast("Connection failed - check if server is running", "error");
    updateStatus("Error", "bg-red-600 text-red-100");
    isConnected = false;
    updateConnectionInfo("Connection failed");
  };
};

const handleServerMessage = (data) => {
  if (data.type === "room-created") {
    handleRoomCreated(data.roomId);
  } else if (data.type === "data-stored") {
    handleDataStored(data.roomId);
  } else if (data.type === "error") {
    showToast(data.message || "Server error", "error");
  }
};

const handleRoomCreated = async (roomId) => {
  const text = elements.sensitiveText.value.trim();
  if (!text) {
    showToast("Please enter some text to share", "error");
    return;
  }

  currentAESKey = generateAESKey();
  const encryptedText = await encryptText(text, currentAESKey);

  const message = {
    type: "send-data",
    roomId: roomId,
    payload: encryptedText,
  };

  ws.send(JSON.stringify(message));

  chrome.runtime.sendMessage({
    type: "ROOM_CREATED",
    roomId: roomId,
  });
};

const handleDataStored = (roomId) => {
  const keyBase64 = arrayBufferToBase64(currentAESKey);
  const secureLink = `http://localhost:4000/#${roomId}:${keyBase64}`;

  elements.secureLink.value = secureLink;
  elements.shareSection.classList.add("hidden");
  elements.resultSection.classList.remove("hidden");

  copyToClipboard(secureLink);

  updateStatus("Success", "bg-green-600 text-green-100");
  updateConnectionInfo("Secure link generated and copied to clipboard");
  showToast("Link copied!", "success");
};

const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast("Link copied!", "success");
    })
    .catch(() => {
      showToast("Failed to copy link", "error");
    });
};

const openLinkInNewWindow = (url) => {
  chrome.windows.create(
    {
      url: url,
      type: "popup",
      width: 800,
      height: 600,
      focused: true,
    },
    (window) => {
      if (chrome.runtime.lastError) {
        showToast("Failed to open link in new window", "error");
      } else {
        showToast("Link opened in new window!", "success");
      }
    }
  );
};

const resetForm = () => {
  elements.sensitiveText.value = "";
  elements.shareSection.classList.remove("hidden");
  elements.resultSection.classList.add("hidden");
  updateStatus("Ready", "bg-gray-700 text-gray-300");
  updateConnectionInfo("Enter text to share securely");

  chrome.runtime.sendMessage({
    type: "ROOM_LEFT",
  });
};

const shareSecurely = async () => {
  const text = elements.sensitiveText.value.trim();
  if (!text) {
    showToast("Please enter some text to share", "error");
    return;
  }

  if (!isConnected) {
    connectWebSocket();
    setTimeout(() => {
      if (isConnected) {
        shareSecurely();
      } else {
        showToast("Failed to connect to server", "error");
      }
    }, 1000);
    return;
  }

  updateStatus("Creating secure room...", "bg-yellow-600 text-yellow-100");
  updateConnectionInfo("Creating secure room...");

  const message = {
    type: "create-room",
  };

  ws.send(JSON.stringify(message));
};

elements.shareSecurely.addEventListener("click", shareSecurely);
elements.copyLink.addEventListener("click", () => {
  copyToClipboard(elements.secureLink.value);
});
elements.openLink.addEventListener("click", () => {
  openLinkInNewWindow(elements.secureLink.value);
});
elements.shareAgain.addEventListener("click", resetForm);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PENDING_MESSAGES") {
    console.log("Received pending messages:", message.messages);
  }
});

updateStatus("Ready", "bg-gray-700 text-gray-300");
updateConnectionInfo("Enter text to share securely");
