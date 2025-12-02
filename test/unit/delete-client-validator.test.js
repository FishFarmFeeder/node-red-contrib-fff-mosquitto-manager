const DeleteClientValidator = require('../../src/lib/validators/delete-client-validator');

describe('DeleteClientValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new DeleteClientValidator();
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