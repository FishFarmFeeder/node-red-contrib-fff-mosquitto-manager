// test/setupTests.js
// Jest global setup: provides a shared mock logger adapter and silences console
// output so test runs are clean and readable.
//
// Usage in tests:
//   const adapter = global.__TEST_LOGGER_ADAPTER__;
//   const logger = new Logger({ component: 'X' }, adapter);
//   adapter.warn.mockClear(); // reset between assertions
//   expect(adapter.warn).toHaveBeenCalledWith(expect.stringContaining('something'));

const mockAdapter = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

global.__TEST_LOGGER_ADAPTER__ = mockAdapter;

// Reset all mock calls before each test so no state leaks between tests
beforeEach(() => {
  mockAdapter.debug.mockClear();
  mockAdapter.info.mockClear();
  mockAdapter.warn.mockClear();
  mockAdapter.error.mockClear();
});

// Silence console output to keep CI logs clean.
// Tests that need to assert on console behaviour should spy/restore explicitly.
beforeAll(() => {
  global.__ORIG_CONSOLE__ = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  /* eslint-disable no-console */
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
  /* eslint-enable no-console */
});

afterAll(() => {
  if (global.__ORIG_CONSOLE__) {
    /* eslint-disable no-console */
    console.log = global.__ORIG_CONSOLE__.log;
    console.warn = global.__ORIG_CONSOLE__.warn;
    console.error = global.__ORIG_CONSOLE__.error;
    console.debug = global.__ORIG_CONSOLE__.debug;
    /* eslint-enable no-console */
    delete global.__ORIG_CONSOLE__;
  }
});
