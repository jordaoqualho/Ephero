class EpheroApp {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.currentAESKey = null;
    this.elements = this.initializeElements();
    this.initializeEventListeners();
    this.initializeUI();
  }

  initializeElements() {
    return {
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
  }

  initializeEventListeners() {
    this.elements.shareSecurely.addEventListener("click", () => this.handleShareSecurely());
    this.elements.copyLink.addEventListener("click", () => this.handleCopyLink());
    this.elements.openLink.addEventListener("click", () => this.handleOpenLink());
    this.elements.shareAgain.addEventListener("click", () => this.handleShareAgain());

    chrome.runtime.onMessage.addListener((message) => this.handleBackgroundMessage(message));
  }

  initializeUI() {
    this.updateStatus("Ready", "bg-gray-700 text-gray-300");
    this.updateConnectionInfo("Enter text to share securely");
  }

  updateStatus(status, className) {
    this.elements.status.textContent = status;
    this.elements.status.className = `text-xs font-medium px-3 py-1 rounded-full ${className}`;
  }

  updateConnectionInfo(info) {
    this.elements.connectionInfo.textContent = info;
  }

  showToast(message, type = "info") {
    const toast = this.elements.toast;
    const toastMessage = this.elements.toastMessage;

    toastMessage.textContent = message;
    toast.classList.remove("bg-gray-800", "bg-green-600", "bg-red-600");

    const typeClasses = {
      success: "bg-green-600",
      error: "bg-red-600",
      info: "bg-gray-800",
    };

    toast.classList.add(typeClasses[type] || typeClasses.info);
    toast.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");
    toast.classList.add("opacity-100", "translate-y-0");

    setTimeout(() => {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
    }, 2000);
  }

  generateAESKey() {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async encryptText(text, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["encrypt"]);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, cryptoKey, data);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return this.arrayBufferToBase64(combined);
  }

  connectWebSocket() {
    try {
      this.ws = new WebSocket("ws://localhost:4000");
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.showToast("Failed to create connection", "error");
    }
  }

  setupWebSocketHandlers() {
    this.ws.onopen = () => this.handleWebSocketOpen();
    this.ws.onmessage = (event) => this.handleWebSocketMessage(event);
    this.ws.onclose = () => this.handleWebSocketClose();
    this.ws.onerror = (error) => this.handleWebSocketError(error);
  }

  handleWebSocketOpen() {
    this.isConnected = true;
    this.updateStatus("Connected", "bg-green-600 text-green-100");
    this.updateConnectionInfo("Connected to server");
    this.sendBackgroundMessage({ type: "WEBSOCKET_CONNECTED" });
  }

  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.handleServerMessage(data);
    } catch (error) {
      console.error("Error parsing message:", error);
      this.showToast("Invalid server response", "error");
    }
  }

  handleWebSocketClose() {
    this.isConnected = false;
    this.updateStatus("Disconnected", "bg-gray-700 text-gray-300");
    this.updateConnectionInfo("Connection lost");
    this.sendBackgroundMessage({ type: "WEBSOCKET_DISCONNECTED" });
  }

  handleWebSocketError(error) {
    console.error("WebSocket error:", error);
    this.showToast("Connection failed - check if server is running", "error");
    this.updateStatus("Error", "bg-red-600 text-red-100");
    this.isConnected = false;
    this.updateConnectionInfo("Connection failed");
  }

  handleServerMessage(data) {
    const handlers = {
      "room-created": (roomId) => this.handleRoomCreated(roomId),
      "data-stored": (roomId) => this.handleDataStored(roomId),
      error: (message) => this.showToast(message || "Server error", "error"),
    };

    const handler = handlers[data.type];
    if (handler) {
      handler(data.roomId || data.message);
    }
  }

  async handleRoomCreated(roomId) {
    const text = this.elements.sensitiveText.value.trim();
    if (!text) {
      this.showToast("Please enter some text to share", "error");
      return;
    }

    this.currentAESKey = this.generateAESKey();
    const encryptedText = await this.encryptText(text, this.currentAESKey);

    const message = {
      type: "send-data",
      roomId: roomId,
      payload: encryptedText,
    };

    this.ws.send(JSON.stringify(message));
    this.sendBackgroundMessage({ type: "ROOM_CREATED", roomId: roomId });
  }

  handleDataStored(roomId) {
    const keyBase64 = this.arrayBufferToBase64(this.currentAESKey);
    const secureLink = `http://localhost:4000/#${roomId}:${keyBase64}`;

    this.elements.secureLink.value = secureLink;
    this.elements.shareSection.classList.add("hidden");
    this.elements.resultSection.classList.remove("hidden");

    this.copyToClipboard(secureLink);
    this.updateStatus("Success", "bg-green-600 text-green-100");
    this.updateConnectionInfo("Secure link generated and copied to clipboard");
    this.showToast("Link copied!", "success");
  }

  copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => this.showToast("Link copied!", "success"))
      .catch(() => this.showToast("Failed to copy link", "error"));
  }

  openLinkInNewWindow(url) {
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
          this.showToast("Failed to open link in new window", "error");
        } else {
          this.showToast("Link opened in new window!", "success");
        }
      }
    );
  }

  resetForm() {
    this.elements.sensitiveText.value = "";
    this.elements.shareSection.classList.remove("hidden");
    this.elements.resultSection.classList.add("hidden");
    this.updateStatus("Ready", "bg-gray-700 text-gray-300");
    this.updateConnectionInfo("Enter text to share securely");
    this.sendBackgroundMessage({ type: "ROOM_LEFT" });
  }

  async handleShareSecurely() {
    const text = this.elements.sensitiveText.value.trim();
    if (!text) {
      this.showToast("Please enter some text to share", "error");
      return;
    }

    if (!this.isConnected) {
      this.connectWebSocket();
      setTimeout(() => {
        if (this.isConnected) {
          this.handleShareSecurely();
        } else {
          this.showToast("Failed to connect to server", "error");
        }
      }, 1000);
      return;
    }

    this.updateStatus("Creating secure room...", "bg-yellow-600 text-yellow-100");
    this.updateConnectionInfo("Creating secure room...");

    const message = { type: "create-room" };
    this.ws.send(JSON.stringify(message));
  }

  handleCopyLink() {
    this.copyToClipboard(this.elements.secureLink.value);
  }

  handleOpenLink() {
    this.openLinkInNewWindow(this.elements.secureLink.value);
  }

  handleShareAgain() {
    this.resetForm();
  }

  handleBackgroundMessage(message) {
    if (message.type === "PENDING_MESSAGES") {
      console.log("Received pending messages:", message.messages);
    }
  }

  sendBackgroundMessage(message) {
    try {
      chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error("Failed to send message to background:", error);
    }
  }
}

new EpheroApp();
