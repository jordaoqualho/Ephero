chrome.runtime.onInstalled.addListener(() => {
  console.log("Ephero extension installed");
});

chrome.action.onClicked.addListener((tab) => {});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SHARE_SELECTION") {
    handleShareSelection(request.data, sender.tab);
  }

  if (request.type === "GET_SERVER_STATUS") {
    checkServerStatus().then(sendResponse);
    return true;
  }
});

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

function handleShareSelection(text, tab) {
  chrome.storage.local.set({
    pendingShare: {
      text: text,
      timestamp: Date.now(),
      tabId: tab.id,
    },
  });

  chrome.action.openPopup();
}
