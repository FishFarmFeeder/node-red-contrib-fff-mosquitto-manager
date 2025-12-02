const Validator = require('./validator');

/**
 * Create Client Validator
 */
class CreateClientValidator extends Validator {
  validate(payload) {
    const errors = [];

    if (!payload.username) {
      errors.push('username is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(payload.username)) {
      errors.push('username can only contain alphanumeric characters, - and _');
    }

    if (!payload.password) {
      errors.push('password is required');
    } else if (payload.password.length < 8) {
      errors.push('password must be at least 8 characters');
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
}

module.exports = CreateClientValidator;
