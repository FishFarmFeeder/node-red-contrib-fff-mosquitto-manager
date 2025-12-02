const mqtt = require('mqtt');
const MQTTConnectionManager = require('../lib/connection/mqtt-connection-manager');
const CommandExecutor = require('../lib/commands/command-executor');
const { ValidationRegistry, registerValidators } = require('../lib/validators');

module.exports = function (RED) {
  function MosquittoConfigNode(n) {
    RED.nodes.createNode(this, n);

    const config = {
      broker: n.broker,
      port: n.port,
      username: this.credentials.username,
      password: this.credentials.password,
    };

    // Create components (Dependency Injection for testability)
    this.connectionManager = new MQTTConnectionManager(config, mqtt);

    const validationRegistry = new ValidationRegistry();
    registerValidators(validationRegistry);

    this.commandExecutor = new CommandExecutor(
      this.connectionManager,
      validationRegistry,
      { timeout: 30000, maxRetries: 3 },
    );

    // Connect
    this.connectionManager.connect();

    // Public method for executing commands
    this.executeCommand = (command, payload) => {
      return this.commandExecutor.execute(command, payload);
    };

    // Cleanup on close
    this.on('close', (done) => {
      this.commandExecutor.cleanup();
      this.connectionManager.disconnect(false);
      setTimeout(done, 500);
    });
  }

  RED.nodes.registerType('mosquitto-config', MosquittoConfigNode, {
    credentials: {
      username: { type: 'text' },
      password: { type: 'password' },
    },
  });
};
