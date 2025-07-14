import * as fs from "fs";
import { getSecurityConfig } from "./security";

export const PRODUCTION_CONFIG = {
  SSL: {
    key: process.env["SSL_KEY_PATH"] ? fs.readFileSync(process.env["SSL_KEY_PATH"]) : null,
    cert: process.env["SSL_CERT_PATH"] ? fs.readFileSync(process.env["SSL_CERT_PATH"]) : null,
  },

  SECURITY: {
    CORS_ORIGINS: process.env["ALLOWED_DOMAINS"]?.split(",") || ["https://ephero.com"],
    RATE_LIMIT: {
      MAX_REQUESTS: parseInt(process.env["RATE_LIMIT_MAX"] || "100"),
      WINDOW_MS: parseInt(process.env["RATE_LIMIT_WINDOW"] || "60000"),
    },
    ENCRYPTION: {
      ALGORITHM: "AES-GCM",
      KEY_SIZE: 256,
    },
    HEADERS: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    },
  },

  MONITORING: {
    ENABLED: true,
    ALERT_WEBHOOK: process.env["ALERT_WEBHOOK_URL"],
    METRICS_ENDPOINT: process.env["METRICS_ENDPOINT"],
    LOG_LEVEL: process.env["LOG_LEVEL"] || "info",
  },
};

export const getProductionConfig = () => {
  const baseConfig = getSecurityConfig();
  return {
    ...baseConfig,
    ...PRODUCTION_CONFIG,
  };
};
