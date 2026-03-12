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
    // Pass logger adapter to components so logs show up in Node-RED UI
    const loggerAdapter = (RED && RED.log) ? {
      debug: (m) => RED.log.debug(m),
      info: (m) => RED.log.info(m),
      warn: (m) => RED.log.warn(m),
      error: (m) => RED.log.error(m),
    } : null;

    this.connectionManager = new MQTTConnectionManager(config, mqtt, { loggerAdapter });

    const validationRegistry = new ValidationRegistry();
    registerValidators(validationRegistry);

    this.commandExecutor = new CommandExecutor(
      this.connectionManager,
      validationRegistry,
      { timeout: 30000, maxRetries: 3, loggerAdapter },
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
