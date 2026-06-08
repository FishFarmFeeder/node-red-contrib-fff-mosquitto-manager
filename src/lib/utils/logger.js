// Simple logger utility with levels and adapter support
// Integrates with Node-RED's logging adapter when provided.

const LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  NONE: 50,
};

class Logger {
  constructor(context = {}, adapter = null, level = null) {
    this.context = context;
    // adapter: optional object with methods debug/info/warn/error matching RED.log
    this.adapter = adapter;

    // Determine level precedence:
    // 1) explicit level parameter
    // 2) process.env.LOG_LEVEL
    // 3) default: in tests be quieter, otherwise INFO
    const fromEnv = process.env.LOG_LEVEL || null;
    const resolved = level || (fromEnv ? fromEnv.toUpperCase() : null);
    if (resolved && LEVELS[resolved]) {
      this.level = LEVELS[resolved];
    } else {
      // If an adapter is provided, assume the caller wants logs routed to it
      // and default to INFO even in test environment so adapter-based tests
      // can assert on log calls. If no adapter, be quieter during tests.
      if (this.adapter) {
        this.level = LEVELS.INFO;
      } else if (process.env.NODE_ENV === 'test') {
        this.level = LEVELS.ERROR;
      } else {
        this.level = LEVELS.INFO;
      }
    }
  }

  setContext(key, value) {
    this.context[key] = value;
  }

  setLevel(levelName) {
    const up = String(levelName || '').toUpperCase();
    if (LEVELS[up]) this.level = LEVELS[up];
  }

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  _shouldLog(levelName) {
    const lvl = LEVELS[levelName] || LEVELS.INFO;
    return lvl >= this.level && this.level !== LEVELS.NONE;
  }

  _format(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };
    return JSON.stringify(entry);
  }

  debug(message, data) {
    if (!this._shouldLog('DEBUG')) return;
    const payload = this._format('DEBUG', message, data);
    if (this.adapter && typeof this.adapter.debug === 'function') {
      this.adapter.debug(payload);
      return;
    }
    // Fallback to console.log for debug
    console.log(payload);
  }

  info(message, data) {
    if (!this._shouldLog('INFO')) return;
    const payload = this._format('INFO', message, data);
    if (this.adapter && typeof this.adapter.info === 'function') {
      this.adapter.info(payload);
      return;
    }
    console.log(payload);
  }

  warn(message, data) {
    if (!this._shouldLog('WARN')) return;
    const payload = this._format('WARN', message, data);
    if (this.adapter && typeof this.adapter.warn === 'function') {
      this.adapter.warn(payload);
      return;
    }
    console.warn(payload);
  }

  error(message, error, data) {
    if (!this._shouldLog('ERROR')) return;
    const payload = this._format('ERROR', message, {
      ...data,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
    if (this.adapter && typeof this.adapter.error === 'function') {
      this.adapter.error(payload);
      return;
    }
    console.error(payload);
  }

  /**
   * attachConsole() — opt-in, reversible.
   * Replaces global console.log/info/warn/error/debug with wrappers that
   * route through this logger's adapter. Requires an adapter to be set;
   * throws if none is configured.
   *
   * Call detachConsole() to restore originals.
   *
   * WARNING: this monkey-patches the global console. Only use it in the
   * application entry point (e.g. Node-RED node init), never in tests
   * unless you restore immediately after with detachConsole().
   */
  attachConsole() {
    if (!this.adapter) {
      throw new Error(
        'Logger.attachConsole() requires an adapter to be set first via setAdapter() or constructor.',
      );
    }
    if (this._consoleOriginals) {
      // Already attached — no-op to avoid double-wrapping
      return;
    }

    // Save originals
    this._consoleOriginals = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    const self = this;

    /* eslint-disable no-console */
    console.log = (...args) => self.info(args.join(' '));
    console.info = (...args) => self.info(args.join(' '));
    console.warn = (...args) => self.warn(args.join(' '));
    console.error = (...args) => self.error(args.join(' '), null);
    console.debug = (...args) => self.debug(args.join(' '));
    /* eslint-enable no-console */
  }

  /**
   * detachConsole() — restores original console methods.
   * Safe to call even if attachConsole() was never called (no-op).
   */
  detachConsole() {
    if (!this._consoleOriginals) return;

    /* eslint-disable no-console */
    console.log = this._consoleOriginals.log;
    console.info = this._consoleOriginals.info;
    console.warn = this._consoleOriginals.warn;
    console.error = this._consoleOriginals.error;
    console.debug = this._consoleOriginals.debug;
    /* eslint-enable no-console */

    this._consoleOriginals = null;
  }
}

module.exports = Logger;
