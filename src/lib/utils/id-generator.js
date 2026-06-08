const { customAlphabet } = require('nanoid');

// Generate URL-safe IDs (alphanumeric only)
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  16,
);

class IdGenerator {
  /**
   * Generate a unique client ID for MQTT
   * @returns {string} Client ID
   */
  static generateClientId() {
    return `nr-fff-mosquitto-${nanoid(8)}`;
  }
}

module.exports = IdGenerator;
