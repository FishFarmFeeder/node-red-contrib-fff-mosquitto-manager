module.exports = function (RED) {
  function MosquittoManagerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    this.server = RED.nodes.getNode(config.server);
    this.command = config.command;

    if (!this.server) {
      node.error('No server configuration found');
      node.status({ fill: 'red', shape: 'ring', text: 'no config' });
      return;
    }

    // Visual status indicators
    this.server.connectionManager.on('connected', () => {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    this.server.connectionManager.on('disconnected', () => {
      node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    });

    this.server.connectionManager.on('reconnecting', (attempt) => {
      node.status({
        fill: 'yellow',
        shape: 'ring',
        text: `reconnecting (${attempt})`,
      });
    });

    this.server.connectionManager.on('error', (error) => {
      node.status({ fill: 'red', shape: 'ring', text: error.message });
    });

    node.on('input', async (msg, send, done) => {
      // For Node-RED 0.x compatibility
      send =
        send ||
        function () {
          node.send.apply(node, arguments);
        };
      done =
        done ||
        function (err) {
          if (err) {
            node.error(err, msg);
          }
        };

      const command = msg.command || node.command;
      let payload = {};

      if (typeof msg.payload === 'object' && msg.payload !== null) {
        payload = msg.payload;
      }

      try {
        node.status({ fill: 'blue', shape: 'dot', text: 'executing...' });

        const response = await node.server.executeCommand(command, payload);

        msg.payload = response;
        send(msg);

        node.status({ fill: 'green', shape: 'dot', text: 'success' });
        done();
      } catch (error) {
        node.status({ fill: 'red', shape: 'ring', text: error.message });
        done(error);
      }
    });
  }

  RED.nodes.registerType('mosquitto-manager', MosquittoManagerNode);
};
