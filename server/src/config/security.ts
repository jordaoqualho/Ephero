export const SECURITY_CONFIG = {
  PRODUCTION: {
    WS_URL: "wss://api.ephero.com",
    HTTP_URL: "https://api.ephero.com",
    REQUIRE_HTTPS: true,
    ALLOWED_ORIGINS: ["https://ephero.com", "https://app.ephero.com"],
    RATE_LIMIT: {
      MAX_REQUESTS: 100,
      WINDOW_MS: 60000,
    },
    MAX_TEXT_LENGTH: 10000,
    ENCRYPTION: {
      ALGORITHM: "AES-GCM",
      KEY_SIZE: 256,
    },
  },

  DEVELOPMENT: {
    WS_URL: "ws://localhost:4000",
    HTTP_URL: "http://localhost:4000",
    REQUIRE_HTTPS: false,
    ALLOWED_ORIGINS: ["http://localhost:3000", "http://localhost:4000"],
    RATE_LIMIT: {
      MAX_REQUESTS: 1000,
      WINDOW_MS: 60000,
    },
    MAX_TEXT_LENGTH: 10000,
    ENCRYPTION: {
      ALGORITHM: "AES-GCM",
      KEY_SIZE: 256,
    },
  },
};

export const getSecurityConfig = () => {
  const env = process.env["NODE_ENV"] || "development";
  return SECURITY_CONFIG[env.toUpperCase() as keyof typeof SECURITY_CONFIG] || SECURITY_CONFIG.DEVELOPMENT;
};
