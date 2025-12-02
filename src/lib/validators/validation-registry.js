/**
 * Validation Registry
 * Responsibility: Register and execute validators (SRP + OCP)
 */
class ValidationRegistry {
  constructor() {
    this.validators = new Map();
  }

  /**
   * Register a validator for a command
   * @param {string} command - Command name
   * @param {Validator} validator - Validator instance
   * @returns {ValidationRegistry} this (for chaining)
   */
  register(command, validator) {
    this.validators.set(command, validator);
    return this;
  }

  /**
   * Validate payload for a command
   * @param {string} command - Command name
   * @param {Object} payload - Payload to validate
   * @returns {Object} { valid: boolean, errors?: string[] }
   */
  validate(command, payload) {
    const validator = this.validators.get(command);

    if (!validator) {
      // No validator registered = valid by default
      return { valid: true };
    }

    return validator.validate(payload);
  }

  /**
   * Check if command has a validator
   * @param {string} command - Command name
   * @returns {boolean}
   */
  hasValidator(command) {
    return this.validators.has(command);
  }
}

module.exports = ValidationRegistry;
