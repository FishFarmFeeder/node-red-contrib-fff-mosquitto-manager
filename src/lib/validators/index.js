const ValidationRegistry = require('./validation-registry');
const CreateClientValidator = require('./create-client-validator');
const DeleteClientValidator = require('./delete-client-validator');
const SetPasswordValidator = require('./set-password-validator');
const AddClientRoleValidator = require('./add-client-role-validator');
const EnableClientValidator = require('./enable-client-validator');
const DisableClientValidator = require('./disable-client-validator');
const CreateRoleValidator = require('./create-role-validator');
const CreateGroupValidator = require('./create-group-validator');

/**
 * Register all validators
 * @param {ValidationRegistry} registry - The validation registry
 * @returns {ValidationRegistry} The registry with all validators registered
 */
function registerValidators(registry) {
  registry.register('createClient', new CreateClientValidator());
  registry.register('deleteClient', new DeleteClientValidator());
  registry.register('setClientPassword', new SetPasswordValidator());
  registry.register('addClientRole', new AddClientRoleValidator());
  registry.register('removeClientRole', new AddClientRoleValidator()); // Same validation
  registry.register('enableClient', new EnableClientValidator());
  registry.register('disableClient', new DisableClientValidator());
  registry.register('createRole', new CreateRoleValidator());
  registry.register('createGroup', new CreateGroupValidator());

  return registry;
}

module.exports = {
  ValidationRegistry,
  registerValidators,
};
