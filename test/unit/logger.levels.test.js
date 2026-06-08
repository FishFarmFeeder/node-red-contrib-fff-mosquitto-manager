const Logger = require('../../src/lib/utils/logger');

// Helper: create a fresh mock adapter (jest.fn per method)
const makeAdapter = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

// Helper: parse the JSON payload passed to the adapter and return the object
const parse = (mockFn, callIndex = 0) =>
  JSON.parse(mockFn.mock.calls[callIndex][0]);

describe('Logger — default level behaviour', () => {
  test('with adapter and no explicit level, defaults to INFO — debug is suppressed', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.debug('this should not appear');
    logger.info('this should appear');

    expect(adapter.debug).not.toHaveBeenCalled();
    expect(adapter.info).toHaveBeenCalledTimes(1);
    const entry = parse(adapter.info);
    expect(entry.message).toBe('this should appear');
    expect(entry.level).toBe('INFO');
  });

  test('with adapter, warn and error are visible at default INFO level', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.warn('a warning');
    logger.error('an error', new Error('boom'));

    expect(adapter.warn).toHaveBeenCalledTimes(1);
    expect(adapter.error).toHaveBeenCalledTimes(1);

    expect(parse(adapter.warn).message).toBe('a warning');
    expect(parse(adapter.error).message).toBe('an error');
    expect(parse(adapter.error).error.message).toBe('boom');
  });

  test('without adapter and NODE_ENV=test, defaults to ERROR — info and warn are suppressed', () => {
    // No adapter — NODE_ENV is already 'test' in jest
    const consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    };

    const logger = new Logger({ component: 'test' });
    logger.info('should be silent');
    logger.warn('should also be silent');
    logger.error('this should reach console.error');

    expect(consoleSpy.log).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();

    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
  });
});

describe('Logger — setLevel()', () => {
  test('setLevel(DEBUG) enables debug messages through the adapter', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.setLevel('DEBUG');
    logger.debug('debug after setLevel');

    expect(adapter.debug).toHaveBeenCalledTimes(1);
    expect(parse(adapter.debug).message).toBe('debug after setLevel');
    expect(parse(adapter.debug).level).toBe('DEBUG');
  });

  test('setLevel(WARN) suppresses info but passes warn and error', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.setLevel('WARN');
    logger.debug('nope');
    logger.info('nope');
    logger.warn('yes');
    logger.error('yes too', null);

    expect(adapter.debug).not.toHaveBeenCalled();
    expect(adapter.info).not.toHaveBeenCalled();
    expect(adapter.warn).toHaveBeenCalledTimes(1);
    expect(adapter.error).toHaveBeenCalledTimes(1);
  });

  test('setLevel(NONE) suppresses everything', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.setLevel('NONE');
    logger.debug('nope');
    logger.info('nope');
    logger.warn('nope');
    logger.error('nope', null);

    expect(adapter.debug).not.toHaveBeenCalled();
    expect(adapter.info).not.toHaveBeenCalled();
    expect(adapter.warn).not.toHaveBeenCalled();
    expect(adapter.error).not.toHaveBeenCalled();
  });

  test('setLevel with invalid value is ignored — level stays unchanged', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.setLevel('BOGUS');   // should be ignored
    logger.debug('still suppressed at INFO default');
    logger.info('still visible');

    expect(adapter.debug).not.toHaveBeenCalled();
    expect(adapter.info).toHaveBeenCalledTimes(1);
  });
});

describe('Logger — setAdapter()', () => {
  test('setAdapter() after construction routes subsequent calls to the new adapter', () => {
    const logger = new Logger({ component: 'test' }); // no adapter initially
    const adapter = makeAdapter();

    logger.setAdapter(adapter);
    // After setAdapter, level will still be ERROR (no adapter at construction time in test env)
    // so set to INFO explicitly
    logger.setLevel('INFO');

    logger.info('routed to new adapter');

    expect(adapter.info).toHaveBeenCalledTimes(1);
    expect(parse(adapter.info).message).toBe('routed to new adapter');
  });

  test('setAdapter() replaces a previous adapter', () => {
    const adapterA = makeAdapter();
    const adapterB = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapterA);

    logger.info('goes to A');
    logger.setAdapter(adapterB);
    logger.info('goes to B');

    expect(adapterA.info).toHaveBeenCalledTimes(1);
    expect(adapterB.info).toHaveBeenCalledTimes(1);
    expect(parse(adapterA.info).message).toBe('goes to A');
    expect(parse(adapterB.info).message).toBe('goes to B');
  });
});

describe('Logger — context enrichment', () => {
  test('context fields are merged into every log entry', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'MyComp', nodeId: 'abc' }, adapter);

    logger.info('context check');

    const entry = parse(adapter.info);
    expect(entry.component).toBe('MyComp');
    expect(entry.nodeId).toBe('abc');
    expect(entry.message).toBe('context check');
  });

  test('setContext() adds a field that appears in subsequent entries', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter);

    logger.setContext('requestId', '123');
    logger.warn('with context');

    const entry = parse(adapter.warn);
    expect(entry.requestId).toBe('123');
  });
});

describe('Logger — explicit level via constructor', () => {
  test('explicit DEBUG level in constructor enables debug from the start', () => {
    const adapter = makeAdapter();
    const logger = new Logger({ component: 'test' }, adapter, 'DEBUG');

    logger.debug('debug from constructor level');

    expect(adapter.debug).toHaveBeenCalledTimes(1);
    expect(parse(adapter.debug).level).toBe('DEBUG');
  });
});
