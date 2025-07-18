/**
 * Ephero Chrome Extension - Background Service
 * Handles secure ephemeral data sharing without server communication
 */

class BackgroundService {
  constructor() {
    this.initializeMessageListener();
    this.initializeEventListeners();
  }

  initializeMessageListener() {
    chrome.runtime.onMessage.addListener((message) => this.handleMessage(message));
  }

  initializeEventListeners() {
    chrome.action.onClicked.addListener(() => this.handlePopupOpen());
    chrome.runtime.onStartup.addListener(() => this.handleStartup());
    chrome.runtime.onInstalled.addListener(() => this.handleInstalled());
  }

  handleMessage(message) {
    console.log("Background received message:", message);

    const handlers = {
      DECRYPT_LINK: (link) => this.handleDecryptLink(link),
      SHARE_DATA: (data) => this.handleShareData(data),
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(message.link || message.data);
    }
  }

  handleDecryptLink(link) {
    // Forward decryption request to popup
    chrome.runtime.sendMessage({
      type: "DECRYPT_LINK",
      link: link,
    });
  }

  handleShareData(data) {
    // Forward share request to popup
    chrome.runtime.sendMessage({
      type: "SHARE_DATA",
      data: data,
    });
  }

  handlePopupOpen() {
    // Handle popup opening - could be used for notifications
    console.log("Popup opened");
  }

  handleStartup() {
    console.log("Ephero extension started");
    this.cleanup();
  }

  handleInstalled() {
    console.log("Ephero extension installed");
    this.cleanup();
  }

  cleanup() {
    // Clean up any stored data on startup/install
    chrome.storage.local.clear(() => {
      console.log("Storage cleared");
    });
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
}

// Initialize the background service
new BackgroundService();
