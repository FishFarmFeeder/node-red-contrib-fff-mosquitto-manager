const EventEmitter = require('events');
const { ConnectionError, SubscriptionError } = require('../utils/errors');
const Logger = require('../utils/logger');
const IdGenerator = require('../utils/id-generator');

/**
 * MQTT Connection Manager
 * Responsibility: Manage MQTT connection lifecycle (SRP)
 */
class MQTTConnectionManager extends EventEmitter {
  constructor(config, mqttClient, options = {}) {
    super();
    this.config = config;
    this.mqttClient = mqttClient;
    this.client = null;
    this.isSubscribed = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    // allow optional logger adapter (maps to RED.log)
    const Logger = require('../utils/logger');
    this.logger = new Logger({ component: 'MQTTConnectionManager' }, options.loggerAdapter || null);
  }

  connect() {
    const brokerUrl = `mqtt://${this.config.broker}:${this.config.port}`;
    const options = {
      username: this.config.username,
      password: this.config.password,
      clientId: IdGenerator.generateClientId(),
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true,
    };

    this.logger.info('Connecting to broker', {
      broker: this.config.broker,
      port: this.config.port,
    });
    this.client = this.mqttClient.connect(brokerUrl, options);
    this._attachEventHandlers();
  }

  _attachEventHandlers() {
    this.client.on('connect', () => {
      this.logger.info('Connected to Mosquitto broker');
      this.reconnectAttempts = 0;
      this._subscribe();
      this.emit('connected');
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      this.isSubscribed = false;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error('Max reconnect attempts reached', null, {
          attempts: this.reconnectAttempts,
        });
        try {
          this.client.end();
        } catch (e) {
          // best-effort
        }
        this.emit('error', new ConnectionError('Max reconnect attempts reached'));
      } else {
        this.logger.warn('Reconnecting to broker', {
          attempt: this.reconnectAttempts,
        });
        this.emit('reconnecting', this.reconnectAttempts);
      }
    });

    this.client.on('error', (err) => {
      this.logger.error('MQTT connection error', err);
      this.emit('error', new ConnectionError(err.message));
    });

    this.client.on('close', () => {
      this.logger.info('Connection closed');
      this.isSubscribed = false;
      this.emit('disconnected');
    });

    // Message handler for responses
    this.client.on('message', (topic, message) => {
      if (topic === '$CONTROL/dynamic-security/v1/response') {
        this.emit('response', message);
      }
    });
  }

  _subscribe() {
    if (this.isSubscribed) {
      return;
    }

    this.client.subscribe('$CONTROL/dynamic-security/v1/response', (err) => {
      if (err) {
        this.logger.error('Subscription failed', err);
        this.emit('error', new SubscriptionError(err.message));
      } else {
        this.isSubscribed = true;
        this.logger.info('Subscribed to response topic');
        this.emit('subscribed');
      }
    });
  }

  publish(topic, message) {
    if (!this.client || !this.client.connected) {
      throw new ConnectionError('Not connected to broker');
    }
    return this.client.publish(topic, message);
  }

  isConnected() {
    return this.client && this.client.connected;
  }

  disconnect(force = false) {
    if (this.client) {
      this.logger.info('Disconnecting from broker', { force });
      this.client.end(force);
    }
  }
}

module.exports = MQTTConnectionManager;
