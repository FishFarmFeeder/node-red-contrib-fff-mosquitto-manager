const EventEmitter = require('events');
const CommandExecutor = require('../../src/lib/commands/command-executor');
const ValidationRegistry = require('../../src/lib/validators/validation-registry');

class FakeConnection extends EventEmitter {
  constructor(responseDelay) {
    super();
    this._published = 0;
    this._scheduled = false;
    this._responseDelay = responseDelay;
  }

  publish(topic, message) {
    this._published += 1;
    // schedule a single response at configured delay (simulate remote broker)
    if (!this._scheduled && this._responseDelay != null) {
      this._scheduled = true;
      const command = (() => {
        try {
          const parsed = JSON.parse(message);
          return parsed.commands && parsed.commands[0] && parsed.commands[0].command;
        } catch (e) {
          return 'unknown';
        }
      })();
      setTimeout(() => {
        this.emit('response', Buffer.from(JSON.stringify({ responses: [{ command }] })));
      }, this._responseDelay);
    }
  }
}

describe('CommandExecutor timeout and race behavior', () => {
  test('resolves when response arrives before timeout (no retry)', async () => {
    const fakeConn = new FakeConnection(10);
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, { timeout: 100, maxRetries: 3 });

    // perform command
    const result = await executor.execute('listClients', {});

    expect(result).toBeDefined();
    expect(fakeConn._published).toBe(1);
    expect(result.responses && result.responses[0] && result.responses[0].command).toBe('listClients');
  });

  test('retries when response arrives after first timeout and eventually resolves', async () => {
    // Response delayed so first attempt times out, but will be emitted before second attempt expires
    const responseDelay = 80; // ms after first publish we will emit
    const timeout = 50;
    const fakeConn = new FakeConnection(responseDelay);
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, { timeout, maxRetries: 2 });

    const result = await executor.execute('listClients', {});

    expect(result).toBeDefined();
    // because first attempt timed out and we re-enqueued, publish should have been called at least twice
    expect(fakeConn._published).toBeGreaterThanOrEqual(2);
    expect(result.responses && result.responses[0] && result.responses[0].command).toBe('listClients');
  });

  test('rejects when no response and retries exhausted', async () => {
    const fakeConn = new FakeConnection(null); // no response scheduled
    const validationRegistry = new ValidationRegistry();
    const executor = new CommandExecutor(fakeConn, validationRegistry, { timeout: 30, maxRetries: 1 });

    await expect(executor.execute('listClients', {})).rejects.toThrow(/timed out/);
  });
});
