const ValidationRegistry = require('../../src/lib/validators/validation-registry');
const CreateClientValidator = require('../../src/lib/validators/create-client-validator');

describe('ValidationRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ValidationRegistry();
  });

  test('should register and validate with validator', () => {
    const validator = new CreateClientValidator();
    registry.register('createClient', validator);

    const validPayload = { username: 'testuser', password: 'securepass123' };
    const result = registry.validate('createClient', validPayload);
    expect(result.valid).toBe(true);

    const invalidPayload = { username: 'testuser' };
    const invalidResult = registry.validate('createClient', invalidPayload);
    expect(invalidResult.valid).toBe(false);
  });

  test('should return valid for unregistered command', () => {
    const result = registry.validate('unknownCommand', {});
    expect(result.valid).toBe(true);
  });

  test('should check if validator exists', () => {
    expect(registry.hasValidator('createClient')).toBe(false);
    registry.register('createClient', new CreateClientValidator());
    expect(registry.hasValidator('createClient')).toBe(true);
  });
});