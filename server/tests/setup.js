// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  console.log("🧪 Setting up test environment...");
});

afterAll(() => {
  // Clean up any global test resources
  console.log("🧹 Cleaning up test environment...");
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
