const Validator = require('./validator');

/**
 * Create Role Validator
 */
class CreateRoleValidator extends Validator {
  validate(payload) {
    const errors = [];

    if (!payload.rolename) {
      errors.push('rolename is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(payload.rolename)) {
      errors.push('rolename can only contain alphanumeric characters, - and _');
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
}

module.exports = CreateRoleValidator;
