const Validator = require('./validator');

/**
 * Add Client Role Validator
 */
class AddClientRoleValidator extends Validator {
  validate(payload) {
    const errors = [];

    if (!payload.username) {
      errors.push('username is required');
    }

    if (!payload.rolename) {
      errors.push('rolename is required');
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
}

module.exports = AddClientRoleValidator;
