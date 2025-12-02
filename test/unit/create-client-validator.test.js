const CreateClientValidator = require('../../src/lib/validators/create-client-validator');

describe('CreateClientValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new CreateClientValidator();
  });

  test('should validate valid payload', () => {
    const payload = { username: 'testuser', password: 'securepass123' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(true);
  });

  test('should require username', () => {
    const payload = { password: 'securepass123' };
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

  test('should validate username format', () => {
    const payload = { username: 'test@user', password: 'securepass123' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('username can only contain alphanumeric characters, - and _');
  });

  test('should validate password length', () => {
    const payload = { username: 'testuser', password: 'short' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('password must be at least 8 characters');
  });
});