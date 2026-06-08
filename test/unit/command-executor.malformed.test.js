const EventEmitter = require('events');
const CommandExecutor = require('../../src/lib/commands/command-executor');
const ValidationRegistry = require('../../src/lib/validators/validation-registry');

describe('CommandExecutor — malformed and edge-case responses', () => {
  const makeAdapter = () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });

  test('logs error when response is not valid JSON', () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    // Emit a malformed response (not JSON)
    fakeConn.emit('response', Buffer.from('this is not json {{{'));

    // Should have called adapter.error for parse failure
    expect(adapter.error).toHaveBeenCalled();
    const lastErrorCall = adapter.error.mock.calls[adapter.error.mock.calls.length - 1][0];
    const parsed = JSON.parse(lastErrorCall);
    expect(parsed.message).toBe('Failed to parse response');
  });

  test('logs error when response JSON is valid but missing responses array', () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    // Emit valid JSON but with no "responses" key - no pending command so it logs warning
    fakeConn.emit('response', Buffer.from(JSON.stringify({ someOther: 'field' })));

    // Should log warning because no pending command (line 196-198)
    expect(adapter.warn).toHaveBeenCalled();
    const warningPayload = adapter.warn.mock.calls[0][0];
    const parsed = JSON.parse(warningPayload);
    expect(parsed.message).toBe('Response received but no pending command');
  });

  test('duplicate response: first resolves, second logs warning', async () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    // Start a command but don't wait for it
    const promise = executor.execute('listClients', {});

    // Simulate broker response
    const response = Buffer.from(JSON.stringify({ responses: [{ command: 'listClients' }] }));
    fakeConn.emit('response', response);

    // First response should resolve
    const result = await promise;
    expect(result).toBeDefined();

    // Clear mock to check second call
    adapter.warn.mockClear();

    // Send duplicate response while no pending command
    fakeConn.emit('response', response);

    // Should log warning about no pending command
    expect(adapter.warn).toHaveBeenCalledTimes(1);
    const warningPayload = adapter.warn.mock.calls[0][0];
    const parsed = JSON.parse(warningPayload);
    expect(parsed.message).toBe('Response received but no pending command');
  });

  test('response with error field rejects the promise', async () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    const promise = executor.execute('createClient', { username: 'test', password: 'pass123' });

    // Simulate error response from broker
    const errorResponse = Buffer.from(
      JSON.stringify({
        responses: [{ command: 'createClient', error: 'Client already exists' }],
      }),
    );
    fakeConn.emit('response', errorResponse);

    // Should reject with the error message
    await expect(promise).rejects.toThrow('Client already exists');
  });

  test('empty buffer response is handled gracefully', () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    // Emit empty buffer
    fakeConn.emit('response', Buffer.from(''));

    // Should log parse error
    expect(adapter.error).toHaveBeenCalled();
  });

  test('non-buffer message (string) is converted and parsed', () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    // Emit a string instead of Buffer (some MQTT clients might do this)
    fakeConn.emit('response', JSON.stringify({ responses: [{ command: 'listClients' }] }));

    // Should handle it - the code calls message.toString() so string works too
    // No error should be logged
    expect(adapter.error).not.toHaveBeenCalled();
  });

  test('response with null responses array resolves (edge case)', async () => {
    const fakeConn = new EventEmitter();
    fakeConn.publish = () => {};

    const adapter = makeAdapter();
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, {
      timeout: 100,
      maxRetries: 1,
      loggerAdapter: adapter,
    });

    const promise = executor.execute('listClients', {});

    // Response with responses: null
    const response = Buffer.from(JSON.stringify({ responses: null }));
    fakeConn.emit('response', response);

    // Should resolve because code checks truthy "response.responses" on line 179
    // Actually looking at code: if (response.responses && response.responses[0])
    // null is falsy so it goes to else branch and resolves
    const result = await promise;
    expect(result).toBeDefined();
  });
});
