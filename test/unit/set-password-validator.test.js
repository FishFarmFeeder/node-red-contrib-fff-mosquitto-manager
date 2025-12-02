const SetPasswordValidator = require('../../src/lib/validators/set-password-validator');

describe('SetPasswordValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SetPasswordValidator();
  });

  test('should validate valid payload', () => {
    const payload = { username: 'testuser', password: 'newsecurepass123' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(true);
  });

  test('should require username', () => {
    const payload = { password: 'newsecurepass123' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('username is required');
  });

  test('should require password', () => {
    const payload = { username: 'testuser' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('password is required');
  });

  test('should validate password length', () => {
    const payload = { username: 'testuser', password: 'short' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('password must be at least 8 characters');
  });
});