const Logger = require('../../src/lib/utils/logger');

// Helper: create a fresh mock adapter
const makeAdapter = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// Helper: parse the JSON payload passed to the adapter
const parse = (mockFn, callIndex = 0) =>
  JSON.parse(mockFn.mock.calls[callIndex][0]);

// Save the real console methods before the global setup silences them
// so we can restore per-test without relying on global.__ORIG_CONSOLE__
const REAL_CONSOLE = {
  log: global.__ORIG_CONSOLE__
    ? global.__ORIG_CONSOLE__.log
    : console.log,
  info: global.__ORIG_CONSOLE__
    ? global.__ORIG_CONSOLE__.log
    : console.info,
  warn: global.__ORIG_CONSOLE__
    ? global.__ORIG_CONSOLE__.warn
    : console.warn,
  error: global.__ORIG_CONSOLE__
    ? global.__ORIG_CONSOLE__.error
    : console.error,
  debug: global.__ORIG_CONSOLE__
    ? global.__ORIG_CONSOLE__.log
    : console.debug,
};

afterEach(() => {
  // Safety net: always restore real console methods after each test so
  // monkey-patching never leaks into other test files.
  console.log = REAL_CONSOLE.log;
  console.info = REAL_CONSOLE.info;
  console.warn = REAL_CONSOLE.warn;
  console.error = REAL_CONSOLE.error;
  console.debug = REAL_CONSOLE.debug;
});

describe('Logger — attachConsole() / detachConsole()', () => {
  test('attachConsole() throws when no adapter is set', () => {
    const logger = new Logger({ component: 'test' });
    expect(() => logger.attachConsole()).toThrow(/adapter/i);
  });

  test('attachConsole() routes console.log to adapter.info', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.attachConsole();
    console.log('hello from console.log');
    logger.detachConsole();

    expect(adapter.info).toHaveBeenCalledTimes(1);
    expect(parse(adapter.info).message).toBe('hello from console.log');
  });

  test('attachConsole() routes console.warn to adapter.warn', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.attachConsole();
    console.warn('a warning via console');
    logger.detachConsole();

    expect(adapter.warn).toHaveBeenCalledTimes(1);
    expect(parse(adapter.warn).message).toBe('a warning via console');
  });

  test('attachConsole() routes console.error to adapter.error', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.attachConsole();
    console.error('an error via console');
    logger.detachConsole();

    expect(adapter.error).toHaveBeenCalledTimes(1);
    expect(parse(adapter.error).message).toBe('an error via console');
  });

  test('attachConsole() routes console.debug to adapter.debug', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter, 'DEBUG');

    logger.attachConsole();
    console.debug('a debug via console');
    logger.detachConsole();

    expect(adapter.debug).toHaveBeenCalledTimes(1);
    expect(parse(adapter.debug).message).toBe('a debug via console');
  });

  test('detachConsole() restores original console methods', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    const originalLog = console.log;
    logger.attachConsole();

    // While attached, console.log is replaced
    expect(console.log).not.toBe(originalLog);

    logger.detachConsole();

    // After detach, original is restored
    expect(console.log).toBe(originalLog);
  });

  test('calling attachConsole() twice does not double-wrap', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.attachConsole();
    const wrappedLog = console.log;
    logger.attachConsole(); // second call — should be no-op

    // console.log reference must not have changed
    expect(console.log).toBe(wrappedLog);

    logger.detachConsole();
  });

  test('detachConsole() is safe to call when not attached (no-op)', () => {
    const logger = new Logger({ component: 'test' });
    expect(() => logger.detachConsole()).not.toThrow();
  });

  test('multiple console args are joined and appear in the log entry', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.attachConsole();
    console.log('foo', 'bar', 'baz');
    logger.detachConsole();

    expect(adapter.info).toHaveBeenCalledTimes(1);
    expect(parse(adapter.info).message).toBe('foo bar baz');
  });
});
