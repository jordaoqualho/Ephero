export class InputValidator {
  static validateText(text: string, maxLength: number = 10000): boolean {
    if (!text || typeof text !== "string") return false;
    if (text.length > maxLength) return false;

    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) return false;
    }

    return true;
  }

  static validateRoomId(roomId: string): boolean {
    if (!roomId || typeof roomId !== "string") return false;
    return /^[A-F0-9]{8}$/.test(roomId);
  }

  static validateMessageType(type: string): boolean {
    const validTypes = ["create-room", "join-room", "send-data", "leave-room", "message", "welcome", "error"];
    return validTypes.includes(type);
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }
}
