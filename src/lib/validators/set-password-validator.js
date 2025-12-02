const Validator = require('./validator');

/**
 * Set Client Password Validator
 */
class SetPasswordValidator extends Validator {
  validate(payload) {
    const errors = [];

    if (!payload.username) {
      errors.push('username is required');
    }

    if (!payload.password) {
      errors.push('password is required');
    } else if (payload.password.length < 8) {
      errors.push('password must be at least 8 characters');
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
}

module.exports = SetPasswordValidator;
