// Simple logger utility
// In a more complex implementation, this could integrate with Node-RED's logging system

class Logger {
  constructor(context = {}, adapter = null) {
    this.context = context;
    // adapter: optional object with methods debug/info/warn/error matching RED.log
    this.adapter = adapter;
  }

  setContext(key, value) {
    this.context[key] = value;
  }

  _format(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };
    return typeof entry === 'string' ? entry : JSON.stringify(entry);
  }

  debug(message, data) {
    const payload = this._format('DEBUG', message, data);
    if (this.adapter && typeof this.adapter.debug === 'function') {
      this.adapter.debug(payload);
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(payload);
    }
  }

  info(message, data) {
    const payload = this._format('INFO', message, data);
    if (this.adapter && typeof this.adapter.info === 'function') {
      this.adapter.info(payload);
      return;
    }
    console.log(payload);
  }

  warn(message, data) {
    const payload = this._format('WARN', message, data);
    if (this.adapter && typeof this.adapter.warn === 'function') {
      this.adapter.warn(payload);
      return;
    }
    console.warn(payload);
  }

  error(message, error, data) {
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
}

module.exports = Logger;
