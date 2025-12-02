# node-red-contrib-fff-mosquitto-manager

[![NPM](https://img.shields.io/npm/v/node-red-contrib-fff-mosquitto-manager)](https://www.npmjs.com/package/node-red-contrib-fff-mosquitto-manager)
[![CI](https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-98.61%25-brightgreen)](https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Node-RED node for managing Mosquitto MQTT broker via the Dynamic Security Plugin.

## ✨ Features

- 🔐 **User Management**: Create, delete, enable/disable clients
- 🔑 **Password Management**: Set and update client passwords  
- 👥 **Role Management**: Create roles and assign them to clients
- 📦 **Group Management**: Organize clients into groups
- ⚡ **Robust**: Automatic reconnection, timeout handling, and retry logic
- ✅ **Validated**: Input validation for all commands with payloads
- 🎨 **Visual Status**: Connection status indicators in Node-RED UI

## 📦 Installation

```bash
cd ~/.node-red
npm install node-red-contrib-fff-mosquitto-manager
```

Then restart Node-RED.

## 🚀 Quick Start

### Prerequisites

- Mosquitto broker v2.0+ with Dynamic Security Plugin enabled
- Admin user with permissions on `$CONTROL/dynamic-security/#` topics

### Basic Usage

1. **Add Configuration Node**:
   - Drag `mosquitto manager` node into your flow
   - Click the pencil icon next to "Server"
   - Fill in broker details and admin credentials

2. **Use Commands**:
   - Select a command from the dropdown
   - Send appropriate payload via `msg.payload`

### Example Flow

```json
[
    {
        "id": "inject1",
        "type": "inject",
        "name": "List Clients",
        "payload": "",
        "topic": "",
        "wires": [["manager1"]]
    },
    {
        "id": "manager1",
        "type": "mosquitto-manager",
        "name": "",
        "server": "config1",
        "command": "listClients",
        "wires": [["debug1"]]
    }
]
```

## 📖 Commands

### Client Management

#### List Clients

No payload required.

```javascript
msg.payload = {};
```

#### Create Client

```javascript
msg.payload = {
    username: "user1",
    password: "securepass123"
};
```

#### Delete Client

```javascript
msg.payload = {
    username: "user1"
};
```

#### Enable/Disable Client

```javascript
msg.payload = {
    username: "user1"
};
```

#### Set Client Password

```javascript
msg.payload = {
    username: "user1",
    password: "newsecurepass456"
};
```

### Role Management

#### List Roles

No payload required.

#### Create Role

```javascript
msg.payload = {
    rolename: "my-role"
};
```

#### Add Role to Client

```javascript
msg.payload = {
    username: "user1",
    rolename: "my-role"
};
```

### Group Management

#### List Groups

No payload required.

#### Create Group

```javascript
msg.payload = {
    groupname: "my-group"
};
```

## ✅ Input Validation

All commands that require a payload are validated for correctness:

### Client Commands

- **username**: Required, alphanumeric characters, hyphens, and underscores only
- **password**: Required for creation/update, minimum 8 characters

### Role Commands

- **rolename**: Required, alphanumeric characters, hyphens, and underscores only

### Group Commands

- **groupname**: Required, alphanumeric characters, hyphens and underscores only

Commands without payloads do not require validation.

## 🔧 Configuration

### mosquitto-config Node

| Property | Description | Default |
|----------|-------------|---------|
| Broker | Hostname or IP of Mosquitto broker | localhost |
| Port | MQTT port | 1883 |
| Username | Admin username | admin |
| Password | Admin password (encrypted) | - |

### mosquitto-manager Node

| Property | Description |
|----------|-------------|
| Server | Reference to mosquitto-config node |
| Command | Default command to execute |

You can override the command per message by setting `msg.command`.

## 🎨 Status Indicators

The node shows visual status in the Node-RED editor:

- 🟢 **Green dot**: Connected and ready / Command succeeded
- 🔵 **Blue dot**: Executing command
- 🟡 **Yellow ring**: Reconnecting to broker
- 🔴 **Red ring**: Disconnected or command failed

## 🏗️ Architecture

This node follows SOLID principles with clean separation of concerns:

- **MQTTConnectionManager**: Handles MQTT connection lifecycle
- **CommandExecutor**: Executes commands with timeout and retry
- **ValidationRegistry**: Validates command payloads
- **Custom Validators**: Per-command validation logic

## 🐛 Troubleshooting

### "Not connected to broker"

- Verify broker hostname and port
- Check that broker is running: `docker ps` or `systemctl status mosquitto`
- Verify credentials are correct

### "Validation failed: username is required"

- Ensure you're sending correct payload structure for the command
- Check examples in this README

### Commands timeout

- Default timeout is 30 seconds
- Check broker logs: `docker logs mosquitto-dev`
- Verify Dynamic Security plugin is enabled in `mosquitto.conf`

### Dynamic Security not enabled

Add to your `mosquitto.conf`:

```conf
plugin /usr/lib/x86_64-linux-gnu/mosquitto_dynamic_security.so
plugin_opt_config_file /mosquitto/config/dynamic-security.json
```

## 🧪 Development

### Project Structure

```text
node-red-contrib-fff-mosquitto-manager/
├── src/
│   ├── lib/
│   │   ├── connection/          # MQTT connection management
│   │   ├── commands/            # Command execution
│   │   ├── validators/          # Input validation
│   │   └── utils/               # Utilities (logger, errors, ID generator)
│   └── nodes/
│       ├── mosquitto-config.js   # Config node
│       └── mosquitto-manager.js  # Manager node
├── test/                         # Comprehensive test suite
│   ├── unit/                    # Unit tests (98.61% coverage)
│   └── integration/             # Integration tests
└── examples/                     # Example flows
```

### Running from Source

```bash
cd ~/node-red-contrib-fff-mosquitto-manager
npm install
npm link

cd ~/.node-red
npm link node-red-contrib-fff-mosquitto-manager
```

Restart Node-RED to see changes.

## 📚 Related Projects

- [eclipse-mosquitto](https://mosquitto.org/) - MQTT broker
- [node-red](https://nodered.org/) - Flow-based programming

## 📝 License

MIT - see [LICENSE](LICENSE) file

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Run formatting: `npm run format`

### Testing Guidelines

This project maintains high test coverage (>80%) and follows these testing practices:

#### Unit Tests

- **Validators**: Test all validation rules, required fields, and format constraints
- **Utilities**: Test error handling, logging, and helper functions
- **Coverage**: Aim for 100% coverage on validators and utilities

#### Integration Tests

- **Command Execution**: Test command flow with mocked MQTT connections
- **Node Functionality**: Test Node-RED node behavior with mocked RED runtime
- **Error Scenarios**: Test timeout, validation failures, and connection issues

#### Test Structure

```text
test/
├── unit/                    # Unit tests for individual components
│   ├── validator-name.test.js
│   └── utility.test.js
└── integration/             # Integration tests
    ├── command-executor.integration.test.js
    └── node-name.node.test.js
```

#### Writing Tests

- Use descriptive test names that explain the behavior being tested
- Test both success and failure scenarios
- Mock external dependencies (MQTT connections, Node-RED runtime)
- Follow the existing patterns in the codebase

#### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npx jest test/unit

# Run only integration tests
npx jest test/integration
```

### Code Quality

- **Linting**: Code must pass ESLint checks (`npm run lint`)
- **Formatting**: Code must be formatted with Prettier (`npm run format`)
- **CI/CD**: All tests must pass on GitHub Actions before merging

### Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass and coverage is maintained
4. Update documentation if needed
5. Submit PR with clear description of changes

## 👤 Author

Carlos Fontán

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/node-red-contrib-fff-mosquitto-manager)
- [GitHub Repository](https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager)
- [Mosquitto Dynamic Security Documentation](https://mosquitto.org/documentation/dynamic-security/)
