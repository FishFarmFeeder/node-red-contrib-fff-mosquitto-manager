const EventEmitter = require('events');
const CommandExecutor = require('../../src/lib/commands/command-executor');
const ValidationRegistry = require('../../src/lib/validators/validation-registry');

describe('CommandExecutor edge cases', () => {
  test('logs a warning when response received but no pending command', () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const mockAdapter = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const validationRegistry = new ValidationRegistry();
    // Instantiate with mocked logger adapter
    /* eslint-disable no-new */
    const executor = new CommandExecutor(fakeConn, validationRegistry, { timeout: 100, maxRetries: 1, loggerAdapter: mockAdapter });
    /* eslint-enable no-new */

    // Emit a response while there's no pending command
    fakeConn.emit('response', Buffer.from(JSON.stringify({ responses: [{ command: 'noop' }] })));

    // Adapter.warn should have been called once
    expect(mockAdapter.warn).toHaveBeenCalledTimes(1);

    // The logger sends a JSON string payload to the adapter; parse and assert
    const payload = mockAdapter.warn.mock.calls[0][0];
    const parsed = JSON.parse(payload);
    expect(parsed.message).toBe('Response received but no pending command');
    // ensure hasPending flag was false in debug context if present
    // (we only assert message here as the main contract)
  });
});
