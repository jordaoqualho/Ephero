# Testing Guide - Ephero WebSocket Server

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── Room.test.js        # Room model tests
│   ├── Client.test.js      # Client model tests
│   └── RoomService.test.js # RoomService tests
├── integration/            # Integration tests for component interactions
│   └── room-functionality.test.js
├── e2e/                   # End-to-end tests with real WebSocket connections
│   └── room-client.test.js
├── setup.js               # Global test setup
└── README.md              # This file
```

## Test Types

### Unit Tests (`tests/unit/`)

- Test individual components in isolation
- Use mocks for dependencies
- Fast execution
- High coverage of business logic

### Integration Tests (`tests/integration/`)

- Test component interactions
- Verify data flow between services
- Test complete workflows

### End-to-End Tests (`tests/e2e/`)

- Test with real WebSocket connections
- Verify complete user workflows
- Test actual server behavior

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### Test Modes

```bash
# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Individual Test Files

```bash
# Run specific test file
npm run test:client
npm run test:room
```

## Test Coverage

The test suite covers:

### Room Model

- ✅ Room creation and properties
- ✅ Client addition/removal
- ✅ Capacity limits
- ✅ TTL expiration
- ✅ Broadcasting functionality

### Client Model

- ✅ Client creation and ID generation
- ✅ Room assignment
- ✅ Message sending
- ✅ WebSocket state handling

### RoomService

- ✅ Room lifecycle management
- ✅ Client room operations
- ✅ Error handling
- ✅ Cleanup processes

### Integration

- ✅ Complete room workflows
- ✅ Multi-client scenarios
- ✅ Real-time messaging

## Writing Tests

### Unit Test Example

```javascript
describe("Component", () => {
  let component;

  beforeEach(() => {
    component = new Component();
  });

  test("should do something", () => {
    const result = component.method();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Example

```javascript
describe("Room Workflow", () => {
  test("should handle complete room lifecycle", async () => {
    // Setup
    const client = await createTestClient();

    // Execute
    await client.createRoom();
    await client.joinRoom(roomId);
    await client.sendMessage("Hello");

    // Verify
    expect(client.messages).toContainEqual(expect.objectContaining({ type: "room_created" }));
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should clearly describe what they test
3. **Arrange-Act-Assert**: Structure tests in three clear sections
4. **Mock Dependencies**: Use mocks for external dependencies
5. **Test Edge Cases**: Include error conditions and boundary cases
6. **Fast Execution**: Keep tests fast for quick feedback

## Debugging Tests

### Verbose Output

```bash
npm test -- --verbose
```

### Debug Specific Test

```bash
npm test -- --testNamePattern="should create room"
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines:

- Unit tests on every commit
- Integration tests on pull requests
- E2E tests on deployment
- Coverage reports generated automatically
