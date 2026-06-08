const mosquittoManagerNode = require('../../src/nodes/mosquitto-manager');
const mosquittoConfigNode = require('../../src/nodes/mosquitto-config');

// Mock MQTT to avoid real connections
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    subscribe: jest.fn((topic, callback) => callback(null)),
    publish: jest.fn(),
    connected: true,
    end: jest.fn(),
  })),
}));

// Mock RED object
const mockRED = {
  nodes: {
    createNode: jest.fn(function(node, config) {
      node.status = jest.fn();
      node.error = jest.fn();
      node.send = jest.fn();
      node.on = jest.fn();
      return node;
    }),
    getNode: jest.fn(() => ({
      executeCommand: jest.fn(),
      connectionManager: {
        on: jest.fn(),
      },
    })),
    registerType: jest.fn(),
  },
};

describe('Mosquitto Manager Node', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Initialize the node module
    mosquittoManagerNode(mockRED);
  });

  it('passes config options to components', () => {
    // Simulate registering and creating the mosquitto-config node
    mosquittoConfigNode(mockRED);
    const MosquittoConfigConstructor = mockRED.nodes.registerType.mock.calls.find(c => c[0] === 'mosquitto-config')[1];

    const config = { broker: 'localhost', port: 1883, commandTimeout: 1234, commandMaxRetries: 2, maxReconnectAttempts: 5 };
    const node = new MosquittoConfigConstructor(config);

    // The config node exposes executeCommand and connectionManager
    expect(node.executeCommand).toBeDefined();
    expect(node.connectionManager).toBeDefined();
    // Validate options forwarded
    expect(node.connectionManager.config.commandTimeout).toBe(1234);
    expect(node.connectionManager.config.commandMaxRetries).toBe(2);
    expect(node.connectionManager.config.maxReconnectAttempts).toBe(5);
  });

  it('should register the node type', () => {
    mosquittoManagerNode(mockRED);
    expect(mockRED.nodes.registerType).toHaveBeenCalledWith('mosquitto-manager', expect.any(Function));
  });

  it('should create node with config', () => {
    const MosquittoManagerNode = mockRED.nodes.registerType.mock.calls[0][1];
    const config = { server: 'config1', command: 'listClients' };
    const node = new MosquittoManagerNode(config);

    expect(mockRED.nodes.createNode).toHaveBeenCalledWith(node, config);
    expect(node.server).toBeDefined();
    expect(node.command).toBe('listClients');
  });

  it('should handle input message', async () => {
    const MosquittoManagerNode = mockRED.nodes.registerType.mock.calls[0][1];
    const config = { server: 'config1', command: 'listClients' };
    const node = new MosquittoManagerNode(config);

    // Mock server executeCommand
    node.server.executeCommand = jest.fn().mockResolvedValue({ success: true });

    const msg = { payload: {} };
    const send = jest.fn();
    const done = jest.fn();

    // Simulate input
    node.on.mock.calls.find(call => call[0] === 'input')[1](msg, send, done);

    await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async

    expect(node.server.executeCommand).toHaveBeenCalledWith('listClients', {});
    expect(send).toHaveBeenCalledWith(msg);
    expect(done).toHaveBeenCalled();
  });

  it('should use msg.command if provided', async () => {
    const MosquittoManagerNode = mockRED.nodes.registerType.mock.calls[0][1];
    const config = { server: 'config1', command: 'listClients' };
    const node = new MosquittoManagerNode(config);

    // Mock server executeCommand
    node.server.executeCommand = jest.fn().mockResolvedValue({ success: true });

    const msg = { command: 'createClient', payload: { username: 'test' } };
    const send = jest.fn();
    const done = jest.fn();

    // Simulate input
    node.on.mock.calls.find(call => call[0] === 'input')[1](msg, send, done);

    await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async

    expect(node.server.executeCommand).toHaveBeenCalledWith('createClient', { username: 'test' });
  });

  it('should handle errors', async () => {
    const MosquittoManagerNode = mockRED.nodes.registerType.mock.calls[0][1];
    const config = { server: 'config1', command: 'listClients' };
    const node = new MosquittoManagerNode(config);

    // Mock server executeCommand to throw error
    node.server.executeCommand = jest.fn().mockRejectedValue(new Error('Test error'));

    const msg = { payload: {} };
    const send = jest.fn();
    const done = jest.fn();

    // Simulate input
    node.on.mock.calls.find(call => call[0] === 'input')[1](msg, send, done);

    await new Promise(resolve => setTimeout(resolve, 10)); // Wait for async

    expect(done).toHaveBeenCalledWith(new Error('Test error'));
  });
});
