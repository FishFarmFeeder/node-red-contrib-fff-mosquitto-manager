const CreateGroupValidator = require('../../src/lib/validators/create-group-validator');

describe('CreateGroupValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new CreateGroupValidator();
  });

  test('should validate valid payload', () => {
    const payload = { groupname: 'admin-group' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(true);
  });

  test('should require groupname', () => {
    const payload = {};
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('groupname is required');
  });

  test('should validate groupname format', () => {
    const payload = { groupname: 'admin@group' };
    const result = validator.validate(payload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('groupname can only contain alphanumeric characters, - and _');
  });
});