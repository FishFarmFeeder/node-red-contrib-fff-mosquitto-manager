/**
 * Base Validator Class
 * Implements Open/Closed Principle - open for extension, closed for modification
 */
class Validator {
  /**
   * Validate payload
   * @param {Object} payload - Payload to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(payload) { // eslint-disable-line no-unused-vars
    throw new Error('Validator.validate() must be implemented by subclass');
  }
}

module.exports = Validator;
