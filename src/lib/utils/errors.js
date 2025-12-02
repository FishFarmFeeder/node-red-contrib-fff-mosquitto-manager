// Custom Error Classes

class MosquittoManagerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MosquittoManagerError';
  }
}

class ConnectionError extends MosquittoManagerError {
  constructor(message) {
    super(message);
    this.name = 'ConnectionError';
  }
}

class TimeoutError extends MosquittoManagerError {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class ValidationError extends MosquittoManagerError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class SubscriptionError extends MosquittoManagerError {
  constructor(message) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

module.exports = {
  MosquittoManagerError,
  ConnectionError,
  TimeoutError,
  ValidationError,
  SubscriptionError,
};
