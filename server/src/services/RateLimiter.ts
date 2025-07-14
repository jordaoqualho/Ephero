export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  isAllowed(clientId: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const clientAttempts = this.attempts.get(clientId);

    if (!clientAttempts || now > clientAttempts.resetTime) {
      this.attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (clientAttempts.count >= maxAttempts) {
      return false;
    }

    clientAttempts.count++;
    return true;
  }

  getRemainingAttempts(clientId: string): number {
    const clientAttempts = this.attempts.get(clientId);
    if (!clientAttempts) return 10;
    return Math.max(0, 10 - clientAttempts.count);
  }

  reset(clientId: string): void {
    this.attempts.delete(clientId);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [clientId, attempts] of this.attempts.entries()) {
      if (now > attempts.resetTime) {
        this.attempts.delete(clientId);
      }
    }
  }
}
