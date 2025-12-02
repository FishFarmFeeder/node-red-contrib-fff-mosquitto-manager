const AddClientRoleValidator = require('../../src/lib/validators/add-client-role-validator');

describe('AddClientRoleValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new AddClientRoleValidator();
  });

  test('should validate valid payload', () => {
    const payload = { username: 'testuser', rolename: 'admin' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(true);
  });

  test('should require username', () => {
    const payload = { rolename: 'admin' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('username is required');
  });

  test('should require rolename', () => {
    const payload = { username: 'testuser' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rolename is required');
  });
});