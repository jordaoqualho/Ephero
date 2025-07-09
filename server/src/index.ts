import { EpheroServer } from "./server";

const port = parseInt(process.env["PORT"] || "8080", 10);
const server = new EpheroServer(port);

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

server.start();
