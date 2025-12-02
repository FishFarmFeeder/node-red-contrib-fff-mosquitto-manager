const { customAlphabet } = require('nanoid');

// Generate URL-safe IDs (alphanumeric only)
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  16,
);

class IdGenerator {
  /**
   * Generate a unique request ID
   * @returns {string} Unique ID
   */
  static generateRequestId() {
    return nanoid();
  }

  /**
   * Generate a unique client ID for MQTT
   * @returns {string} Client ID
   */
  static generateClientId() {
    return `nr-fff-mosquitto-${nanoid(8)}`;
  }
}

module.exports = IdGenerator;
