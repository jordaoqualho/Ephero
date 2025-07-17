/**
 * Ephemeral Key-based Cryptography Module
 * Handles secure data sharing without server communication
 */

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

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
    // Generate ephemeral key pair
    const keyPair = this.generateKeyPair();

    // For "anyone" access, we'll use a temporary recipient key
    // In a real implementation, this could be a known public key or derived differently
    const tempRecipientKey = naclUtil.decodeBase64(keyPair.publicKey); // Using same key for demo

    // Derive shared key
    const sharedKey = this.deriveSharedKey(keyPair.publicKey);

    // Encrypt the data
    const encrypted = this.encrypt(data, sharedKey);

    // Create link data
    const linkData = {
      ephemeralPublicKey: keyPair.publicKey,
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
      // Generate a new ephemeral key pair for decryption
      const keyPair = this.generateKeyPair();

      // Derive shared key using the ephemeral public key from the link
      const sharedKey = this.deriveSharedKey(linkData.ephemeralPublicKey);

      // Decrypt the data
      const decryptedData = this.decrypt(linkData.encryptedData, linkData.nonce, sharedKey);

      // Clear sensitive data from memory
      this.clearSensitiveData();

      return decryptedData;
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
    return btoa(jsonString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  /**
   * Decode link data from URL-safe format
   * @param {string} encodedData - URL-safe encoded string
   * @returns {Object} Decoded link data
   */
  decodeLinkData(encodedData) {
    try {
      // Restore padding and convert back to base64
      let base64 = encodedData.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }

      const jsonString = atob(base64);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error("Invalid link format");
    }
  }
}

export default EphemeralCrypto;
