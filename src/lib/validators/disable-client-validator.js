const Validator = require('./validator');

/**
 * Disable Client Validator
 */
class DisableClientValidator extends Validator {
  validate(payload) {
    if (!payload.username) {
      return { valid: false, errors: ['username is required'] };
    }
    return { valid: true };
  }
}

module.exports = DisableClientValidator;
