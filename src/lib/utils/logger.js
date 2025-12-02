// Simple logger utility
// In a more complex implementation, this could integrate with Node-RED's logging system

class Logger {
  constructor(context = {}) {
    this.context = context;
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
    return JSON.stringify(entry);
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this._format('DEBUG', message, data));
    }
  }

  info(message, data) {
    console.log(this._format('INFO', message, data));
  }

  warn(message, data) {
    console.warn(this._format('WARN', message, data));
  }

  error(message, error, data) {
    console.error(
      this._format('ERROR', message, {
        ...data,
        error: error
          ? {
            message: error.message,
            stack: error.stack,
          }
          : undefined,
      }),
    );
  }
}

module.exports = Logger;
