import { afterEach, jest } from "@jest/globals";

// Mock WebSocket
class MockWebSocket {
  public readyState: number;
  public send: jest.Mock;
  public close: jest.Mock;
  public on: jest.Mock;
  public addEventListener: jest.Mock;
  public removeEventListener: jest.Mock;

  constructor() {
    this.readyState = 1; // OPEN
    this.send = jest.fn();
    this.close = jest.fn();
    this.on = jest.fn();
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
  }
}

// Mock crypto with different IDs
let mockIdCounter = 0;
const mockRandomBytes = jest.fn(() => {
  mockIdCounter++;
  const counter = mockIdCounter.toString().padStart(2, "0");
  return Buffer.from(`1234567890abcdef${counter}`, "hex");
});

jest.mock("crypto", () => ({
  randomBytes: mockRandomBytes,
}));

// Mock ws module
jest.mock("ws", () => {
  return {
    WebSocket: MockWebSocket,
    Server: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
  };
});

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  mockIdCounter = 0;
});

// Export for use in tests
export { mockRandomBytes, MockWebSocket };
