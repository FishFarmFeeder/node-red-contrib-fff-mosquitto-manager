const MQTTConnectionManager = require('../../src/lib/connection/mqtt-connection-manager');
const CommandExecutor = require('../../src/lib/commands/command-executor');
const { ValidationRegistry, registerValidators } = require('../../src/lib/validators');

// Mock MQTT client
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn((topic, callback) => callback(null)), // Simulate successful subscription
    publish: jest.fn(),
    connected: true,
    end: jest.fn(),
  })),
}));

describe('CommandExecutor Integration', () => {
  let connectionManager;
  let validationRegistry;
  let commandExecutor;
  let mockMqttClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup validation registry
    validationRegistry = new ValidationRegistry();
    registerValidators(validationRegistry);

    // Create connection manager with mocked MQTT
    const config = {
      broker: 'localhost',
      port: 1883,
      username: 'admin',
      password: 'password',
    };

    const mqtt = require('mqtt');
    connectionManager = new MQTTConnectionManager(config, mqtt);
    mockMqttClient = mqtt.connect();

    // Simulate connection
    connectionManager.client = mockMqttClient;
    connectionManager.isSubscribed = true;

    // Create command executor
    commandExecutor = new CommandExecutor(connectionManager, validationRegistry, {
      timeout: 1000, // Short timeout for tests
      maxRetries: 1,
    });
  });

  test('should execute createClient command successfully', async () => {
    const payload = { username: 'testuser', password: 'securepass123' };

    // Mock publish and simulate response
    mockMqttClient.publish.mockImplementation(() => {
      // Simulate response event
      setTimeout(() => {
        connectionManager.emit('response', Buffer.from(JSON.stringify({
          responses: [{ command: 'createClient' }],
        })));
      }, 10);
    });

    const result = await commandExecutor.execute('createClient', payload);

    expect(result).toEqual({
      responses: [{ command: 'createClient' }],
    });
    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      '$CONTROL/dynamic-security/v1',
      JSON.stringify({
        commands: [{ command: 'createClient', ...payload }],
      })
    );
  });

  test('should handle command timeout', async () => {
    const payload = { username: 'testuser', password: 'securepass123' };

    // Don't mock response to simulate timeout
    mockMqttClient.on.mockImplementation(() => {});

    await expect(commandExecutor.execute('createClient', payload)).rejects.toThrow('timed out');
  });

  test('should validate payload before executing', async () => {
    const invalidPayload = { password: 'securepass123' }; // Missing username

    await expect(commandExecutor.execute('createClient', invalidPayload)).rejects.toThrow('username is required');
  });
});