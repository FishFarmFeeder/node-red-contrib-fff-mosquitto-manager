const Validator = require('./validator');

/**
 * Enable Client Validator
 */
class EnableClientValidator extends Validator {
  validate(payload) {
    if (!payload.username) {
      return { valid: false, errors: ['username is required'] };
    }
    return { valid: true };
  }
}

module.exports = EnableClientValidator;
