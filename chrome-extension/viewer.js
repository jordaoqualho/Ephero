document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const secureLink = urlParams.get("link");
  const contentDiv = document.getElementById("content");
  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => window.close());
  if (!secureLink) {
    contentDiv.textContent = "No secure link found.";
    return;
  }
  try {
    const linkManager = new window.LinkManager();
    const decryptedContent = linkManager.extractDataFromLink(secureLink);
    contentDiv.textContent = decryptedContent;
  } catch (error) {
    contentDiv.textContent = "Error: " + error.message;
  }
});
