export interface AuditLogEntry {
  timestamp: string;
  event: string;
  clientId: string;
  ip?: string | undefined;
  userAgent?: string | undefined;
  action: string;
  success: boolean;
  details?: Record<string, unknown> | undefined;
}

export class AuditLogger {
  private static logToFile(entry: AuditLogEntry): void {
    const logLine = JSON.stringify(entry) + "\n";
    console.log("🔒 AUDIT:", logLine.trim());
  }

  static logSecurityEvent(event: string, clientId: string, details: Partial<AuditLogEntry>): void {
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      clientId,
      ip: details.ip,
      userAgent: details.userAgent,
      action: details.action || "unknown",
      success: details.success || false,
      details: details.details,
    };

    this.logToFile(logEntry);
  }

  static logConnection(clientId: string, ip: string, userAgent: string): void {
    this.logSecurityEvent("CONNECTION", clientId, {
      ip,
      userAgent,
      action: "websocket_connect",
      success: true,
    });
  }

  static logDisconnection(clientId: string, ip: string): void {
    this.logSecurityEvent("DISCONNECTION", clientId, {
      ip,
      action: "websocket_disconnect",
      success: true,
    });
  }

  static logRoomCreation(clientId: string, roomId: string, ip: string): void {
    this.logSecurityEvent("ROOM_CREATION", clientId, {
      ip,
      action: "create_room",
      success: true,
      details: { roomId },
    });
  }

  static logDataSharing(clientId: string, roomId: string, ip: string, dataSize: number): void {
    this.logSecurityEvent("DATA_SHARING", clientId, {
      ip,
      action: "send_data",
      success: true,
      details: { roomId, dataSize },
    });
  }

  static logSecurityThreat(clientId: string, threatType: string, details: Record<string, unknown>): void {
    this.logSecurityEvent("SECURITY_THREAT", clientId, {
      action: threatType,
      success: false,
      details,
    });
  }

  static logRateLimitExceeded(clientId: string, ip: string): void {
    this.logSecurityEvent("RATE_LIMIT_EXCEEDED", clientId, {
      ip,
      action: "rate_limit_violation",
      success: false,
    });
  }
}
