/**
 * Ephero Chrome Extension - Content Script
 * Handles text selection and secure sharing without server communication
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SHARE_SELECTION") {
    handleShareSelection(request.data);
  }
});

function handleShareSelection(text) {
  // Highlight the selected text briefly
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const originalBackground = range.commonAncestorContainer.parentElement?.style.backgroundColor;

    if (range.commonAncestorContainer.parentElement) {
      range.commonAncestorContainer.parentElement.style.backgroundColor = "#667eea";
      setTimeout(() => {
        if (range.commonAncestorContainer.parentElement) {
          range.commonAncestorContainer.parentElement.style.backgroundColor = originalBackground;
        }
      }, 1000);
    }
  }

  // Store the selected text for sharing
  chrome.storage.local.set({
    pendingShare: {
      text: text,
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
    },
  });

  showNotification("Text ready for secure sharing with Ephero");
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Track text selection
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    chrome.storage.local.set({
      lastSelection: {
        text: selectedText,
        timestamp: Date.now(),
      },
    });
  }
});

// Keyboard shortcut for sharing (Ctrl+Shift+S or Cmd+Shift+S)
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "S") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      handleShareSelection(selectedText);
      event.preventDefault();
    }
  }
});

// Context menu integration
document.addEventListener("contextmenu", (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    // Store the selection for context menu access
    chrome.storage.local.set({
      contextMenuSelection: {
        text: selectedText,
        timestamp: Date.now(),
      },
    });
  }
});
