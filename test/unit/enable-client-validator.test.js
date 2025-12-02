const EnableClientValidator = require('../../src/lib/validators/enable-client-validator');

describe('EnableClientValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new EnableClientValidator();
  });

  test('should validate valid payload', () => {
    const payload = { username: 'testuser' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(true);
  });

  test('should require username', () => {
    const payload = {};
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('username is required');
  });
});