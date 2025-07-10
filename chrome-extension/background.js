// Background service worker for Ephero extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Ephero extension installed");
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to default_popup in manifest
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SHARE_SELECTION") {
    // Handle sharing selected text from context menu
    handleShareSelection(request.data, sender.tab);
  }

  if (request.type === "GET_SERVER_STATUS") {
    // Check if server is available
    checkServerStatus().then(sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Handle context menu creation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ephero-share-selection",
    title: "Share securely with Ephero",
    contexts: ["selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ephero-share-selection") {
    chrome.tabs.sendMessage(tab.id, {
      type: "SHARE_SELECTION",
      data: info.selectionText,
    });
  }
});

// Check if WebSocket server is available
async function checkServerStatus() {
  try {
    const response = await fetch("http://localhost:8080/health", {
      method: "GET",
      mode: "no-cors",
    });
    return { status: "available" };
  } catch (error) {
    return { status: "unavailable", error: error.message };
  }
}

// Handle sharing selected text
function handleShareSelection(text, tab) {
  // Store the text temporarily for the popup to access
  chrome.storage.local.set({
    pendingShare: {
      text: text,
      timestamp: Date.now(),
      tabId: tab.id,
    },
  });

  // Open popup or notify user
  chrome.action.openPopup();
}
