import { EpheroServer } from "./server";

const port = parseInt(process.env["PORT"] || "3000", 10);
const defaultTTL = parseInt(process.env["ROOM_TTL_MINUTES"] || "5", 10) * 60 * 1000;
const server = new EpheroServer(port, defaultTTL);

process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down server...");
  server.stop();
  process.exit(0);
});

console.log(`🚀 Starting Ephero server on port ${port}`);
console.log(`⏰ Room TTL: ${defaultTTL / (60 * 1000)} minutes`);
server.start();
