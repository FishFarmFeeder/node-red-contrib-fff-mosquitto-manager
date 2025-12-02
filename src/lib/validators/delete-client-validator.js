const Validator = require('./validator');

/**
 * Delete Client Validator
 */
class DeleteClientValidator extends Validator {
  validate(payload) {
    if (!payload.username) {
      return { valid: false, errors: ['username is required'] };
    }
    return { valid: true };
  }
}

module.exports = DeleteClientValidator;
