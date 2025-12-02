const DisableClientValidator = require('../../src/lib/validators/disable-client-validator');

describe('DisableClientValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DisableClientValidator();
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