/**
 * Ephemeral Key-based Cryptography Module
 * Handles secure data sharing without server communication
 */

// Use global variables for tweetnacl
const nacl = window.nacl;
const naclUtil = window.nacl.util;

// Only define the class if it doesn't already exist
if (typeof window.EphemeralCrypto === "undefined") {
  class EphemeralCrypto {
    constructor() {
      this.keyPair = null;
      this.sharedKey = null;
    }

    /**
     * Generate a new ephemeral key pair
     * @returns {Object} Key pair with publicKey and secretKey
     */
    generateKeyPair() {
      this.keyPair = nacl.box.keyPair();
      return {
        publicKey: naclUtil.encodeBase64(this.keyPair.publicKey),
        secretKey: naclUtil.encodeBase64(this.keyPair.secretKey),
      };
    }

    /**
     * Derive a shared key using X25519 key exchange
     * @param {string} recipientPublicKey - Base64 encoded recipient public key
     * @returns {Uint8Array} Shared key for encryption/decryption
     */
    deriveSharedKey(recipientPublicKey) {
      if (!this.keyPair) {
        throw new Error("Key pair not generated");
      }

      const recipientKey = naclUtil.decodeBase64(recipientPublicKey);
      this.sharedKey = nacl.box.before(recipientKey, this.keyPair.secretKey);
      return this.sharedKey;
    }

    /**
     * Encrypt data using the shared key
     * @param {string} data - Data to encrypt
     * @param {Uint8Array} sharedKey - Shared key for encryption
     * @returns {Object} Encrypted data with nonce
     */
    encrypt(data, sharedKey) {
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const messageUint8 = naclUtil.decodeUTF8(data);

      const encryptedMessage = nacl.secretbox(messageUint8, nonce, sharedKey);

      return {
        encrypted: naclUtil.encodeBase64(encryptedMessage),
        nonce: naclUtil.encodeBase64(nonce),
      };
    }

    /**
     * Decrypt data using the shared key
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} nonce - Base64 encoded nonce
     * @param {Uint8Array} sharedKey - Shared key for decryption
     * @returns {string} Decrypted data
     */
    decrypt(encryptedData, nonce, sharedKey) {
      const encryptedUint8 = naclUtil.decodeBase64(encryptedData);
      const nonceUint8 = naclUtil.decodeBase64(nonce);

      const decryptedMessage = nacl.secretbox.open(encryptedUint8, nonceUint8, sharedKey);

      if (!decryptedMessage) {
        throw new Error("Failed to decrypt message");
      }

      return naclUtil.encodeUTF8(decryptedMessage);
    }

    /**
     * Create a secure link with encrypted data
     * @param {string} data - Data to encrypt and share
     * @returns {Object} Link data with encrypted content and ephemeral public key
     */
    createSecureLink(data) {
      // Generate a random symmetric key for encryption
      const symmetricKey = nacl.randomBytes(nacl.secretbox.keyLength);

      // Encrypt the data with the symmetric key
      const encrypted = this.encrypt(data, symmetricKey);

      // Create link data
      const linkData = {
        encryptedData: encrypted.encrypted,
        nonce: encrypted.nonce,
        timestamp: Date.now(),
      };

      // Clear sensitive data from memory
      this.clearSensitiveData();

      return linkData;
    }

    /**
     * Decrypt data from a secure link
     * @param {Object} linkData - Link data with encrypted content
     * @returns {string} Decrypted data
     */
    decryptSecureLink(linkData) {
      try {
        // For now, we'll use a placeholder approach
        // In a real implementation, the key would be derived from the link data
        // For demo purposes, we'll return a placeholder message
        return "This is a secure ephemeral link. The actual decryption would use the key from the link data.";
      } catch (error) {
        throw new Error(`Failed to decrypt secure link: ${error.message}`);
      }
    }

    /**
     * Clear all sensitive data from memory
     */
    clearSensitiveData() {
      if (this.keyPair) {
        // Overwrite secret key with zeros
        const secretKey = naclUtil.decodeBase64(this.keyPair.secretKey);
        for (let i = 0; i < secretKey.length; i++) {
          secretKey[i] = 0;
        }
      }

      if (this.sharedKey) {
        // Overwrite shared key with zeros
        for (let i = 0; i < this.sharedKey.length; i++) {
          this.sharedKey[i] = 0;
        }
      }

      this.keyPair = null;
      this.sharedKey = null;
    }

    /**
     * Encode link data to URL-safe format
     * @param {Object} linkData - Link data to encode
     * @returns {string} URL-safe encoded string
     */
    encodeLinkData(linkData) {
      const jsonString = JSON.stringify(linkData);
      // Use encodeURIComponent to handle Unicode characters safely
      const encoded = encodeURIComponent(jsonString);
      return encoded.replace(/[!'()*]/g, function (c) {
        return "%" + c.charCodeAt(0).toString(16);
      });
    }

    /**
     * Decode link data from URL-safe format
     * @param {string} encodedData - URL-safe encoded string
     * @returns {Object} Decoded link data
     */
    decodeLinkData(encodedData) {
      try {
        // Decode URI component to handle Unicode characters
        const jsonString = decodeURIComponent(encodedData);
        return JSON.parse(jsonString);
      } catch (error) {
        throw new Error("Invalid link format");
      }
    }
  }

  // Make EphemeralCrypto available globally
  window.EphemeralCrypto = EphemeralCrypto;
}
