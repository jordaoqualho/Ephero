/**
 * Ephero Chrome Extension - Popup Application
 * Secure ephemeral data sharing without server communication
 */

// Use global LinkManager
const LinkManager = window.LinkManager;

class EpheroApp {
  constructor() {
    this.linkManager = new LinkManager();
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

    // Listen for background messages
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
    }, 3000);
  }

  async handleShareSecurely() {
    const text = this.elements.sensitiveText.value.trim();

    if (!text) {
      this.showToast("Please enter some text to share", "error");
      return;
    }

    try {
      this.updateStatus("Generating secure link...", "bg-blue-600 text-blue-100");
      this.updateConnectionInfo("Creating ephemeral encryption keys...");

      // Generate secure link
      const secureLink = this.linkManager.generateSecureLink(text);

      // Display the result
      this.elements.secureLink.value = secureLink;
      this.elements.shareSection.classList.add("hidden");
      this.elements.resultSection.classList.remove("hidden");

      // Copy to clipboard
      await this.copyToClipboard(secureLink);

      this.updateStatus("Success", "bg-green-600 text-green-100");
      this.updateConnectionInfo("Secure link generated and copied to clipboard");
      this.showToast("Secure link created and copied!", "success");
    } catch (error) {
      console.error("Error generating secure link:", error);
      this.showToast(`Failed to generate secure link: ${error.message}`, "error");
      this.updateStatus("Error", "bg-red-600 text-red-100");
      this.updateConnectionInfo("Failed to generate secure link");
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast("Link copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      this.showToast("Failed to copy link to clipboard", "error");
    }
  }

  handleCopyLink() {
    const link = this.elements.secureLink.value;
    if (link) {
      this.copyToClipboard(link);
    }
  }

  handleOpenLink() {
    const link = this.elements.secureLink.value;
    if (link) {
      this.openLinkInNewWindow(link);
    }
  }

  openLinkInNewWindow(url) {
    try {
      const viewerUrl = chrome.runtime.getURL("viewer.html") + "?link=" + encodeURIComponent(url);

      chrome.windows.create(
        {
          url: viewerUrl,
          type: "popup",
          width: 800,
          height: 600,
          focused: true,
        },
        (window) => {
          if (chrome.runtime.lastError) {
            this.showToast("Failed to open link in new window", "error");
          } else {
            this.showToast("Secure content opened in new window!", "success");
          }
        }
      );
    } catch (error) {
      console.error("Error opening link:", error);
      this.showToast("Failed to open secure link", "error");
    }
  }

  handleShareAgain() {
    this.resetForm();
  }

  resetForm() {
    this.elements.sensitiveText.value = "";
    this.elements.shareSection.classList.remove("hidden");
    this.elements.resultSection.classList.add("hidden");
    this.updateStatus("Ready", "bg-gray-700 text-gray-300");
    this.updateConnectionInfo("Enter text to share securely");

    // Clean up sensitive data
    this.linkManager.cleanup();
  }

  handleBackgroundMessage(message) {
    switch (message.type) {
      case "DECRYPT_LINK":
        this.handleDecryptLink(message.link);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  async handleDecryptLink(link) {
    try {
      this.updateStatus("Decrypting...", "bg-blue-600 text-blue-100");
      this.updateConnectionInfo("Decrypting secure content...");

      const decryptedData = this.linkManager.extractDataFromLink(link);

      // Display the decrypted content
      this.elements.sensitiveText.value = decryptedData;
      this.elements.shareSection.classList.remove("hidden");
      this.elements.resultSection.classList.add("hidden");

      this.updateStatus("Decrypted", "bg-green-600 text-green-100");
      this.updateConnectionInfo("Content decrypted successfully");
      this.showToast("Content decrypted successfully!", "success");
    } catch (error) {
      console.error("Error decrypting link:", error);
      this.showToast(`Failed to decrypt link: ${error.message}`, "error");
      this.updateStatus("Error", "bg-red-600 text-red-100");
      this.updateConnectionInfo("Failed to decrypt content");
    }
  }

  // Cleanup when popup is closed
  cleanup() {
    this.linkManager.cleanup();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const app = new EpheroApp();

  // Cleanup when popup is closed
  window.addEventListener("beforeunload", () => {
    app.cleanup();
  });
});
