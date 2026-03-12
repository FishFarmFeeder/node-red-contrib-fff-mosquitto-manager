const EventEmitter = require('events');
const MQTTConnectionManager = require('../../src/lib/connection/mqtt-connection-manager');

describe('MQTTConnectionManager', () => {
  let fakeMqtt;
  let mgr;
  const config = { broker: 'localhost', port: 1883, username: 'u', password: 'p' };

  beforeEach(() => {
    fakeMqtt = {
      connect: jest.fn(() => {
        const client = new EventEmitter();
        client.subscribe = jest.fn((topic, cb) => cb(null));
        client.publish = jest.fn();
        client.end = jest.fn();
        client.connected = true;
        return client;
      }),
    };

    mgr = new MQTTConnectionManager(config, fakeMqtt);
  });

  test('connects and subscribes', () => {
    mgr.connect();
    const client = mgr.client;
    expect(fakeMqtt.connect).toHaveBeenCalled();

    // simulate connect
    client.emit('connect');
    expect(mgr.reconnectAttempts).toBe(0);
    expect(mgr.isSubscribed).toBe(true);
  });

  test('handles subscription error', () => {
    mgr.connect();
    const client = mgr.client;
    // attach listener BEFORE triggering connect so we don't get an unhandled emit
    const onError = jest.fn();
    mgr.on('error', onError);
    // override subscribe to simulate error
    client.subscribe = jest.fn((topic, cb) => cb(new Error('sub fail')));
    client.emit('connect');
    expect(onError).toHaveBeenCalled();
  });

  test('publish throws when not connected', () => {
    mgr.client = null;
    expect(() => mgr.publish('t', 'm')).toThrow();
  });

  test('reconnect max attempts emits error and ends client', () => {
    mgr.connect();
    const client = mgr.client;
    const onErr = jest.fn();
    mgr.on('error', onErr);

    // simulate reconnect many times
    for (let i = 0; i < mgr.maxReconnectAttempts; i++) {
      client.emit('reconnect');
    }

    expect(onErr).toHaveBeenCalled();
    expect(client.end).toHaveBeenCalled();
  });
});
