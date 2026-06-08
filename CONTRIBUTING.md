# Contributing to node-red-contrib-fff-mosquitto-manager

Thank you for your interest in contributing! This document outlines the development setup, coding standards, and testing requirements.

## Development Setup

### Prerequisites

- Node.js 14+
- npm 7+
- Git

### Clone and Install

```bash
git clone https://github.com/FishFarmFeeder/node-red-contrib-fff-mosquitto-manager.git
cd node-red-contrib-fff-mosquitto-manager
npm install
```

### Run Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Lint

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Project Structure

```
src/
├── lib/
│   ├── connection/
│   │   └── mqtt-connection-manager.js   # MQTT lifecycle
│   ├── commands/
│   │   └── command-executor.js         # Command execution
│   ├── validators/
│   │   ├── validation-registry.js
│   │   └── *.js                        # Per-command validators
│   └── utils/
│       ├── logger.js                   # Pluggable logger
│       ├── errors.js                   # Custom errors
│       └── id-generator.js             # ID generation
└── nodes/
    ├── mosquitto-config.js             # Config node
    └── mosquitto-manager.js            # Main node
```

## Coding Standards

- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **Jest** for testing
- Follow existing code patterns in the codebase

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific file
npx jest test/unit/command-executor.test.js

# Watch mode
npm run test:watch
```

### Writing Tests

Follow these patterns:

```javascript
describe('ComponentName', () => {
  test('description of behavior', () => {
    // Arrange
    const input = something;

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Test Structure

```
test/
├── unit/                    # Unit tests
│   ├── *.test.js
│   └── validators/
└── integration/             # Integration tests
    └── *.test.js
```

### Using the Mock Logger in Tests

Tests can use the global mock adapter:

```javascript
const Logger = require('../../src/lib/utils/logger');

test('logs a warning', () => {
  const adapter = global.__TEST_LOGGER_ADAPTER__;
  const logger = new Logger({ component: 'X' }, adapter);

  logger.warn('something went wrong');

  expect(adapter.warn).toHaveBeenCalledTimes(1);
  const entry = JSON.parse(adapter.warn.mock.calls[0][0]);
  expect(entry.message).toBe('something went wrong');
});
```

## Logger API

The `Logger` class (`src/lib/utils/logger.js`) provides:

### Constructor

```javascript
new Logger(context, adapter, level)
```

- `context`: Object with contextual fields (e.g., `{ component: 'MyNode' }`)
- `adapter`: Object with `debug/info/warn/error` methods (e.g., `RED.log`)
- `level`: One of `DEBUG`, `INFO`, `WARN`, `ERROR`, `NONE`

### Methods

- `setLevel(levelName)` — Change log level at runtime
- `setAdapter(adapter)` — Replace the adapter
- `attachConsole()` — Route `console.*` to adapter (opt-in)
- `detachConsole()` — Restore original console

### Log Levels

| Level | Description |
|-------|-------------|
| DEBUG | All messages |
| INFO | Info and above |
| WARN | Warnings and errors |
| ERROR | Errors only |
| NONE | Silent |

Set via:
- Constructor third argument
- `logger.setLevel('DEBUG')`
- Environment: `LOG_LEVEL=DEBUG`

## Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass: `npm test`
4. Run linter: `npm run lint`
5. Format code: `npm run format`
6. Update documentation if needed
7. Submit PR with clear description

## CI/CD

All tests must pass on GitHub Actions before merging. The workflow:
- Runs `npm test`
- Runs `npm run lint`
- Uploads coverage to Codecov (if token configured)

## Contact

For questions or discussions, please open an issue on GitHub.
