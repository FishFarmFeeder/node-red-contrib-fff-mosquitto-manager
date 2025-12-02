const CreateRoleValidator = require('../../src/lib/validators/create-role-validator');

describe('CreateRoleValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new CreateRoleValidator();
  });

  test('should validate valid payload', () => {
    const payload = { rolename: 'admin-role' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(true);
  });

  test('should require rolename', () => {
    const payload = {};
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rolename is required');
  });

  test('should validate rolename format', () => {
    const payload = { rolename: 'admin@role' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rolename can only contain alphanumeric characters, - and _');
  });
});