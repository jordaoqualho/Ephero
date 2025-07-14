export class MonitoringService {
  private static threatCount = 0;
  private static lastAlertTime = 0;
  private static readonly ALERT_COOLDOWN = 60000;

  static alertSecurityThreat(event: string, details: Record<string, unknown>): void {
    const now = Date.now();
    this.threatCount++;

    if (now - this.lastAlertTime < this.ALERT_COOLDOWN) {
      return;
    }

    this.lastAlertTime = now;

    console.error("🚨 SECURITY THREAT:", {
      event,
      details,
      threatCount: this.threatCount,
      timestamp: new Date().toISOString(),
    });
  }

  static logMetrics(metric: string, value: number): void {
    console.log("📊 METRIC:", {
      metric,
      value,
      timestamp: new Date().toISOString(),
    });
  }

  static logPerformance(operation: string, duration: number): void {
    if (duration > 1000) {
      this.alertSecurityThreat("SLOW_OPERATION", { operation, duration });
    }

    this.logMetrics(`${operation}_duration`, duration);
  }

  static logError(error: Error, context: string): void {
    console.error("❌ ERROR:", {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static getThreatCount(): number {
    return this.threatCount;
  }

  static resetThreatCount(): void {
    this.threatCount = 0;
  }
}
