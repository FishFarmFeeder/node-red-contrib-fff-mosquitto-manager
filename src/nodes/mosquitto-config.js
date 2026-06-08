const mqtt = require('mqtt');
const MQTTConnectionManager = require('../lib/connection/mqtt-connection-manager');
const CommandExecutor = require('../lib/commands/command-executor');
const { ValidationRegistry, registerValidators } = require('../lib/validators');

module.exports = function (RED) {
  function MosquittoConfigNode(n) {
    RED.nodes.createNode(this, n);

    // Read and validate numeric fields
    const port = parseInt(n.port, 10);
    const commandTimeout = parseInt(n.commandTimeout || 30000, 10);
    const commandMaxRetries = parseInt(n.commandMaxRetries || 3, 10);
    const maxReconnectAttempts = parseInt(n.maxReconnectAttempts || 10, 10);
    const reconnectPeriod = parseInt(n.reconnectPeriod || 5000, 10);
    const connectTimeout = parseInt(n.connectTimeout || 30000, 10);

    if (Number.isNaN(port)) {
      throw new Error('Invalid port number');
    }

    // Clamp/validate values but don't throw in runtime; fallback to defaults
    const safeCommandTimeout = Number.isNaN(commandTimeout) || commandTimeout <= 0 ? 30000 : commandTimeout;
    const safeCommandMaxRetries = Number.isNaN(commandMaxRetries) || commandMaxRetries < 0 ? 3 : commandMaxRetries;
    const safeMaxReconnectAttempts = Number.isNaN(maxReconnectAttempts) || maxReconnectAttempts < 0 ? 10 : maxReconnectAttempts;
    const safeReconnectPeriod = Number.isNaN(reconnectPeriod) || reconnectPeriod < 0 ? 5000 : reconnectPeriod;
    const safeConnectTimeout = Number.isNaN(connectTimeout) || connectTimeout < 0 ? 30000 : connectTimeout;

    // TLS options
    const useTLS = n.useTLS === true || n.useTLS === 'true' || n.useTLS === '1';
    const protocol = n.protocol || 'mqtt';
    const tlsOptions = {};
    if (useTLS || protocol === 'mqtts' || protocol === 'wss') {
      if (n.ca) tlsOptions.ca = n.ca;
      if (n.cert) tlsOptions.cert = n.cert;
      if (n.key) tlsOptions.key = n.key;
    }

    const config = {
      broker: n.broker,
      port,
      username: this.credentials && this.credentials.username ? this.credentials.username : undefined,
      password: this.credentials && this.credentials.password ? this.credentials.password : undefined,
      commandTimeout: safeCommandTimeout,
      commandMaxRetries: safeCommandMaxRetries,
      maxReconnectAttempts: safeMaxReconnectAttempts,
      reconnectPeriod: safeReconnectPeriod,
      connectTimeout: safeConnectTimeout,
      clean: n.clean !== false, // default true
      protocol,
      tlsOptions: Object.keys(tlsOptions).length > 0 ? tlsOptions : undefined,
    };

    // Create components (Dependency Injection for testability)
    // Pass logger adapter to components so logs show up in Node-RED UI
    const loggerAdapter = (RED && RED.log) ? {
      debug: (m) => RED.log.debug(m),
      info: (m) => RED.log.info(m),
      warn: (m) => RED.log.warn(m),
      error: (m) => RED.log.error(m),
    } : null;

    this.connectionManager = new MQTTConnectionManager(config, mqtt, { loggerAdapter, maxReconnectAttempts: config.maxReconnectAttempts });

    const validationRegistry = new ValidationRegistry();
    registerValidators(validationRegistry);

    this.commandExecutor = new CommandExecutor(
      this.connectionManager,
      validationRegistry,
      { timeout: config.commandTimeout, maxRetries: config.commandMaxRetries, loggerAdapter },
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
