// Content script for Secure Share extension
// Handles text selection and context menu integration

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SHARE_SELECTION") {
    handleShareSelection(request.data);
  }
});

// Handle text selection for sharing
function handleShareSelection(text) {
  // Highlight the selected text briefly
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const originalBackground = range.commonAncestorContainer.parentElement?.style.backgroundColor;

    // Flash highlight
    if (range.commonAncestorContainer.parentElement) {
      range.commonAncestorContainer.parentElement.style.backgroundColor = "#667eea";
      setTimeout(() => {
        if (range.commonAncestorContainer.parentElement) {
          range.commonAncestorContainer.parentElement.style.backgroundColor = originalBackground;
        }
      }, 1000);
    }
  }

  // Store the text for the popup to access
  chrome.storage.local.set({
    pendingShare: {
      text: text,
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
    },
  });

  // Show a notification
  showNotification("Text ready for secure sharing");
}

// Show a temporary notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  // Add CSS animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Listen for text selection events
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    // Store selected text for potential sharing
    chrome.storage.local.set({
      lastSelection: {
        text: selectedText,
        timestamp: Date.now(),
      },
    });
  }
});

// Add keyboard shortcut for quick sharing (Ctrl+Shift+S)
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === "S") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      handleShareSelection(selectedText);
      event.preventDefault();
    }
  }
});
