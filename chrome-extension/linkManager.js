/**
 * Secure Link Manager
 * Handles generation and parsing of secure ephemeral links
 */

import EphemeralCrypto from "./crypto.js";

class LinkManager {
  constructor() {
    this.crypto = new EphemeralCrypto();
  }

  /**
   * Generate a secure ephemeral link
   * @param {string} data - Data to encrypt and share
   * @returns {string} Secure link URL
   */
  generateSecureLink(data) {
    try {
      // Create secure link data
      const linkData = this.crypto.createSecureLink(data);

      // Encode the link data
      const encodedData = this.crypto.encodeLinkData(linkData);

      // Create the secure link
      const secureLink = `ephero://secure/${encodedData}`;

      return secureLink;
    } catch (error) {
      throw new Error(`Failed to generate secure link: ${error.message}`);
    }
  }

  /**
   * Parse and decrypt data from a secure link
   * @param {string} secureLink - Secure link URL
   * @returns {string} Decrypted data
   */
  parseSecureLink(secureLink) {
    try {
      // Extract the encoded data from the link
      const match = secureLink.match(/ephero:\/\/secure\/(.+)/);
      if (!match) {
        throw new Error("Invalid secure link format");
      }

      const encodedData = match[1];

      // Decode the link data
      const linkData = this.crypto.decodeLinkData(encodedData);

      // Validate link data structure
      if (!this.isValidLinkData(linkData)) {
        throw new Error("Invalid link data structure");
      }

      // Check if link has expired (optional: 24 hours)
      if (this.isLinkExpired(linkData.timestamp)) {
        throw new Error("Secure link has expired");
      }

      // Decrypt the data
      const decryptedData = this.crypto.decryptSecureLink(linkData);

      return decryptedData;
    } catch (error) {
      throw new Error(`Failed to parse secure link: ${error.message}`);
    }
  }

  /**
   * Validate link data structure
   * @param {Object} linkData - Link data to validate
   * @returns {boolean} True if valid
   */
  isValidLinkData(linkData) {
    return (
      linkData &&
      typeof linkData === "object" &&
      typeof linkData.ephemeralPublicKey === "string" &&
      typeof linkData.encryptedData === "string" &&
      typeof linkData.nonce === "string" &&
      typeof linkData.timestamp === "number"
    );
  }

  /**
   * Check if a link has expired
   * @param {number} timestamp - Link creation timestamp
   * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
   * @returns {boolean} True if expired
   */
  isLinkExpired(timestamp, maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    return now - timestamp > maxAge;
  }

  /**
   * Create a shareable link for clipboard
   * @param {string} data - Data to share
   * @returns {string} Shareable link
   */
  createShareableLink(data) {
    const secureLink = this.generateSecureLink(data);

    // For better UX, we can create a more user-friendly format
    // This could be a custom protocol or a data URL
    return secureLink;
  }

  /**
   * Extract data from various link formats
   * @param {string} link - Link to extract data from
   * @returns {string} Decrypted data
   */
  extractDataFromLink(link) {
    // Handle different link formats
    if (link.startsWith("ephero://secure/")) {
      return this.parseSecureLink(link);
    } else if (link.startsWith("data:text/plain;base64,")) {
      // Handle data URLs (for testing)
      const base64Data = link.replace("data:text/plain;base64,", "");
      const jsonString = atob(base64Data);
      const linkData = JSON.parse(jsonString);
      return this.crypto.decryptSecureLink(linkData);
    } else {
      throw new Error("Unsupported link format");
    }
  }

  /**
   * Clean up sensitive data
   */
  cleanup() {
    this.crypto.clearSensitiveData();
  }
}

export default LinkManager;
