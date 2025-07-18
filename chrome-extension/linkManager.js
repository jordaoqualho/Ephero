const EphemeralCrypto = window.EphemeralCrypto || null;

if (typeof window.LinkManager === "undefined") {
  class LinkManager {
    constructor() {
      if (!EphemeralCrypto) throw new Error("EphemeralCrypto not available. Make sure crypto.js is loaded first.");
      this.crypto = new EphemeralCrypto();
    }
    generateSecureLink(data) {
      try {
        const linkData = this.crypto.createSecureLink(data);
        const encodedData = this.crypto.encodeLinkData(linkData);
        return `ephero://secure/${encodedData}`;
      } catch (error) {
        throw new Error(`Failed to generate secure link: ${error.message}`);
      }
    }
    parseSecureLink(secureLink) {
      try {
        const match = secureLink.match(/ephero:\/\/secure\/(.+)/);
        if (!match) throw new Error("Invalid secure link format");
        const encodedData = match[1];
        const linkData = this.crypto.decodeLinkData(encodedData);
        if (!this.isValidLinkData(linkData)) throw new Error("Invalid link data structure");
        if (this.isLinkExpired(linkData.timestamp)) throw new Error("Secure link has expired");
        return this.crypto.decryptSecureLink(linkData);
      } catch (error) {
        throw new Error(`Failed to parse secure link: ${error.message}`);
      }
    }
    isValidLinkData(linkData) {
      return (
        linkData &&
        typeof linkData === "object" &&
        typeof linkData.encryptedData === "string" &&
        typeof linkData.nonce === "string" &&
        typeof linkData.key === "string" &&
        typeof linkData.timestamp === "number"
      );
    }
    isLinkExpired(timestamp, maxAge = 24 * 60 * 60 * 1000) {
      const now = Date.now();
      return now - timestamp > maxAge;
    }
    createShareableLink(data) {
      return this.generateSecureLink(data);
    }
    extractDataFromLink(link) {
      if (link.startsWith("ephero://secure/")) {
        return this.parseSecureLink(link);
      } else if (link.startsWith("data:text/plain;base64,")) {
        const base64Data = link.replace("data:text/plain;base64,", "");
        const jsonString = atob(base64Data);
        const linkData = JSON.parse(jsonString);
        return this.crypto.decryptSecureLink(linkData);
      } else {
        throw new Error("Unsupported link format");
      }
    }
    cleanup() {
      this.crypto.clearSensitiveData();
    }
  }
  window.LinkManager = LinkManager;
}
