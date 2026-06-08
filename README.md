# node-red-contrib-fff-mosquitto-manager

[![NPM](https://img.shields.io/npm/v/node-red-contrib-fff-mosquitto-manager)](https://www.npmjs.com/package/node-red-contrib-fff-mosquitto-manager)
[![CI](https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Node-RED node for managing Mosquitto MQTT broker users, roles, and groups via the Dynamic Security Plugin. Manage your MQTT broker security directly from Node-RED flows without external tools.

## Why This Node?

- **No CLI needed** — manage users/roles/groups directly from Node-RED
- **Visual feedback** — connection status indicators in the editor
- **Robust** — automatic reconnection, timeout handling, and retry logic
- **Validated** — all commands validate input before sending to broker
- **Flexible** — supports MQTT, MQTTS, WebSocket, and WebSocket TLS

## Requirements

- Node-RED v2.0+
- Mosquitto broker v2.0+ with Dynamic Security Plugin enabled
- Admin credentials with permissions on `$CONTROL/dynamic-security/#` topics

## Installation

### Option 1: Node-RED Palette (Recommended)

1. Open Node-RED (`http://localhost:1880`)
2. Go to **Menu → Manage palette → Install**
3. Search for `node-red-contrib-fff-mosquitto-manager` and install

### Option 2: Command Line

```bash
cd ~/.node-red
npm install node-red-contrib-fff-mosquitto-manager
```

Then restart Node-RED.

## Quick Start

### 1. Configure the Broker

1. Drag a `mosquitto manager` node into your flow
2. Click the pencil icon next to "Server" to create a new config
3. Enter your broker details:
   - **Broker**: your Mosquitto IP/hostname
   - **Port**: 1883 (or 8883 for MQTTS)
   - **Username**: admin user
   - **Password**: admin password

### 2. Send Commands

Select a command from the dropdown or override via `msg.command`:

```javascript
// List all clients
msg.payload = {};

// Create a new user
msg.payload = {
    username: "device1",
    password: "securePassword123"
};

// Delete a user
msg.payload = {
    username: "device1"
};

// Enable/disable a user
msg.payload = {
    username: "device1",
    disabled: true  // false to enable
};

// Change password
msg.payload = {
    username: "device1",
    password: "newPassword456"
};
```

### 3. Example Flow

```json
[
    {
        "id": "inject-create",
        "type": "inject",
        "name": "Create User",
        "payload": "{\"username\": \"sensor1\", \"password\": \"pass123\"}",
        "payloadType": "json",
        "wires": [["manager"]]
    },
    {
        "id": "manager",
        "type": "mosquitto-manager",
        "name": "Mosquitto Manager",
        "server": "config",
        "command": "createClient",
        "wires": [["debug"]]
    },
    {
        "id": "debug",
        "type": "debug",
        "name": "",
        "wires": []
    }
]
```

## Commands Reference

### Client Management

| Command | Description | Required Payload |
|---------|-------------|------------------|
| `listClients` | List all clients | none |
| `createClient` | Create new client | `username`, `password` |
| `deleteClient` | Delete client | `username` |
| `enableClient` | Enable client | `username` |
| `disableClient` | Disable client | `username` |
| `setClientPassword` | Change client password | `username`, `password` |

### Role Management

| Command | Description | Required Payload |
|---------|-------------|------------------|
| `listRoles` | List all roles | none |
| `createRole` | Create new role | `rolename` |
| `addClientRole` | Assign role to client | `username`, `rolename` |

### Group Management

| Command | Description | Required Payload |
|---------|-------------|------------------|
| `listGroups` | List all groups | none |
| `createGroup` | Create new group | `groupname` |

## Configuration

### mosquitto-config Node

| Property | Description | Default |
|----------|-------------|---------|
| Broker | Hostname or IP address | `localhost` |
| Port | MQTT port | `1883` |
| Username | Admin username | - |
| Password | Admin password (encrypted) | - |
| Command timeout (ms) | Max wait for broker response | `30000` |
| Command max retries | Retry attempts on timeout | `3` |
| Max reconnect attempts | MQTT reconnection limit | `10` |
| Reconnect period (ms) | Time between reconnects | `5000` |
| Connect timeout (ms) | MQTT connection timeout | `30000` |
| Clean session | Start with fresh session | `true` |
| Protocol | MQTT/MQTTS/WS/WSS | `mqtt` |
| Use TLS | Enable TLS encryption | `false` |
| CA certificate | TLS CA (PEM format) | - |
| Client certificate | TLS client cert (PEM) | - |
| Client key | TLS client key (PEM) | - |

### mosquitto-manager Node

| Property | Description |
|----------|-------------|
| Server | Reference to config node |
| Command | Default command to execute |

Override command per message: `msg.command = "listClients"`

## TLS / Secure Connections

### MQTTS (Port 8883)

1. Set **Protocol** to `MQTTS`
2. Enable **Use TLS**
3. Optionally add CA certificate

### WebSocket TLS (Port 8081)

1. Set **Protocol** to `WSS`
2. Enable **Use TLS**
3. Configure your broker to enable WebSocket:
   ```conf
   listener 8081
   protocol websockets
   ```

### With Client Certificates

1. Enable **Use TLS**
2. Paste your CA certificate, client certificate, and client key in PEM format

## Status Indicators

The node displays visual status in the Node-RED editor:

| Status | Meaning |
|--------|---------|
| 🟢 Green dot | Connected, ready |
| 🔵 Blue dot | Executing command |
| 🟡 Yellow ring | Reconnecting |
| 🔴 Red ring | Disconnected or error |

## Troubleshooting

### "Not connected to broker"

- Verify broker hostname and port
- Check broker is running: `docker ps` or `systemctl status mosquitto`
- Verify admin credentials are correct
- Check broker logs for connection errors

### "Validation failed"

- Ensure `msg.payload` contains required fields
- Check username format: alphanumeric, hyphens, underscores only
- Password must be at least 8 characters

### "Command timed out"

- Increase **Command timeout** in config (default 30s)
- Check broker is responsive: `mosquitto_pub -t test -m "hello"`
- Verify Dynamic Security plugin is loaded

### Dynamic Security not enabled

Add to your `mosquitto.conf`:

```conf
plugin /usr/lib/x86_64-linux-gnu/mosquitto_dynamic_security.so
plugin_opt_config_file /mosquitto/config/dynamic-security.json
```

Create the initial admin user:

```bash
mosquitto_ctrl -u admin -p adminpass dynsec init /mosquitto/config/dynsec.json
```

## Advanced: Dynamic Commands

You can send any command dynamically via `msg.command`:

```javascript
// In a Function node
msg.command = "listClients";
msg.payload = {};
return msg;
```

## Architecture

This node follows clean architecture principles:

```
src/
├── lib/
│   ├── connection/       # MQTT connection lifecycle
│   ├── commands/         # Command execution with timeout/retry
│   ├── validators/       # Input validation
│   └── utils/           # Logger, errors, ID generation
└── nodes/
    ├── mosquitto-config.js   # Configuration node
    └── mosquitto-manager.js  # Main node
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and coding standards.

## License

MIT - See [LICENSE](LICENSE) file

## Author

Carlos Fontán

## Related

- [Mosquitto Broker](https://mosquitto.org/)
- [Node-RED](https://nodered.org/)
- [Mosquitto Dynamic Security Plugin](https://mosquitto.org/documentation/dynamic-security/)
