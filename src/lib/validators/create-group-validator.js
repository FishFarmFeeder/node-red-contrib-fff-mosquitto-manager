const Validator = require('./validator');

/**
 * Create Group Validator
 */
class CreateGroupValidator extends Validator {
  validate(payload) {
    const errors = [];

    if (!payload.groupname) {
      errors.push('groupname is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(payload.groupname)) {
      errors.push('groupname can only contain alphanumeric characters, - and _');
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
}

module.exports = CreateGroupValidator;
