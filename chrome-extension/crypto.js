const nacl = window.nacl;
const naclUtil = window.nacl.util;

if (typeof window.EphemeralCrypto === "undefined") {
  class EphemeralCrypto {
    constructor() {
      this.keyPair = null;
      this.sharedKey = null;
    }
    generateKeyPair() {
      this.keyPair = nacl.box.keyPair();
      return {
        publicKey: naclUtil.encodeBase64(this.keyPair.publicKey),
        secretKey: naclUtil.encodeBase64(this.keyPair.secretKey),
      };
    }
    deriveSharedKey(recipientPublicKey) {
      if (!this.keyPair) throw new Error("Key pair not generated");
      const recipientKey = naclUtil.decodeBase64(recipientPublicKey);
      this.sharedKey = nacl.box.before(recipientKey, this.keyPair.secretKey);
      return this.sharedKey;
    }
    encrypt(data, key) {
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const messageUint8 = naclUtil.decodeUTF8(data);
      const encryptedMessage = nacl.secretbox(messageUint8, nonce, key);
      return {
        encrypted: naclUtil.encodeBase64(encryptedMessage),
        nonce: naclUtil.encodeBase64(nonce),
      };
    }
    decrypt(encryptedData, nonce, key) {
      const encryptedUint8 = naclUtil.decodeBase64(encryptedData);
      const nonceUint8 = naclUtil.decodeBase64(nonce);
      const decryptedMessage = nacl.secretbox.open(encryptedUint8, nonceUint8, key);
      if (!decryptedMessage) throw new Error("Failed to decrypt message");
      return naclUtil.encodeUTF8(decryptedMessage);
    }
    createSecureLink(data) {
      const symmetricKey = nacl.randomBytes(nacl.secretbox.keyLength);
      const encrypted = this.encrypt(data, symmetricKey);
      const linkData = {
        encryptedData: encrypted.encrypted,
        nonce: encrypted.nonce,
        key: naclUtil.encodeBase64(symmetricKey),
        timestamp: Date.now(),
      };
      this.clearSensitiveData();
      return linkData;
    }
    decryptSecureLink(linkData) {
      try {
        const symmetricKey = naclUtil.decodeBase64(linkData.key);
        const decryptedData = this.decrypt(linkData.encryptedData, linkData.nonce, symmetricKey);
        this.clearSensitiveData();
        return decryptedData;
      } catch (error) {
        throw new Error(`Failed to decrypt secure link: ${error.message}`);
      }
    }
    clearSensitiveData() {
      if (this.keyPair) {
        const secretKey = naclUtil.decodeBase64(this.keyPair.secretKey);
        for (let i = 0; i < secretKey.length; i++) secretKey[i] = 0;
      }
      if (this.sharedKey) {
        for (let i = 0; i < this.sharedKey.length; i++) this.sharedKey[i] = 0;
      }
      this.keyPair = null;
      this.sharedKey = null;
    }
    encodeLinkData(linkData) {
      const jsonString = JSON.stringify(linkData);
      const encoded = encodeURIComponent(jsonString);
      return encoded.replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16));
    }
    decodeLinkData(encodedData) {
      try {
        const jsonString = decodeURIComponent(encodedData);
        return JSON.parse(jsonString);
      } catch (error) {
        throw new Error("Invalid link format");
      }
    }
  }
  window.EphemeralCrypto = EphemeralCrypto;
}
