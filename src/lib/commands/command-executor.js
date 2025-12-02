const {
  TimeoutError,
  ValidationError,
} = require('../utils/errors');
const Logger = require('../utils/logger');

/**
 * Command Executor
 * Responsibility: Execute commands with timeout, retry, and validation (SRP)
 *
 * NOTE: Mosquitto Dynamic Security Plugin does NOT support correlationData,
 * so we must process commands sequentially (one at a time) and match responses
 * to the currently pending command.
 */
class CommandExecutor {
  constructor(connectionManager, validationRegistry, options = {}) {
    this.connection = connectionManager;
    this.validation = validationRegistry;
    this.timeout = options.timeout || 10000; // Reduced timeout for faster feedback
    this.maxRetries = options.maxRetries || 3;
    this.logger = new Logger({ component: 'CommandExecutor' });

    // Sequential processing - only one command at a time
    this.pendingCommand = null;
    this.commandQueue = [];
    this.isProcessing = false;

    // Listen to responses
    this.connection.on('response', (message) => {
      this._handleResponse(message);
    });
  }

  // eslint-disable-next-line require-await
  async execute(command, payload, attempt = 1) {
    // Validate payload
    const validationResult = this.validation.validate(command, payload);
    if (!validationResult.valid) {
      const errorMsg = validationResult.errors.join(', ');
      this.logger.error('Validation failed', new ValidationError(errorMsg), {
        command,
        payload,
      });
      throw new ValidationError(errorMsg);
    }

    return new Promise((resolve, reject) => {
      // Add to queue
      this.commandQueue.push({
        command,
        payload,
        attempt,
        resolve,
        reject,
      });

      // Process queue if not already processing
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.isProcessing || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { command, payload, attempt, resolve, reject } =
      this.commandQueue.shift();

    try {
      const result = await this._executeCommand(command, payload, attempt);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      // Process next command in queue
      this._processQueue();
    }
  }

  _executeCommand(command, payload, attempt) {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingCommand = null;

        if (attempt < this.maxRetries) {
          this.logger.warn('Command timeout, retrying', { command, attempt });
          // Retry by adding back to front of queue
          this.commandQueue.unshift({
            command,
            payload,
            attempt: attempt + 1,
            resolve,
            reject,
          });
          this.isProcessing = false;
          this._processQueue();
        } else {
          const error = new TimeoutError(
            `Command ${command} timed out after ${this.timeout}ms`,
          );
          this.logger.error('Command timeout exceeded retries', error, {
            command,
            attempt,
          });
          reject(error);
        }
      }, this.timeout);

      this.pendingCommand = {
        command,
        resolve: (response) => {
          clearTimeout(timeoutHandle);
          this.pendingCommand = null;
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          this.pendingCommand = null;
          reject(error);
        },
      };

      try {
        this._sendCommand(command, payload);
      } catch (error) {
        clearTimeout(timeoutHandle);
        this.pendingCommand = null;
        reject(error);
      }
    });
  }

  _sendCommand(command, payload) {
    const request = {
      commands: [
        {
          command,
          ...payload,
        },
      ],
    };

    this.logger.debug('Sending command', { command, payload });
    this.connection.publish(
      '$CONTROL/dynamic-security/v1',
      JSON.stringify(request),
    );
  }

  _handleResponse(message) {
    try {
      const response = JSON.parse(message.toString());

      this.logger.debug('Response received', {
        hasPending: !!this.pendingCommand,
        response: response.responses ? response.responses[0] : null,
      });

      if (this.pendingCommand) {
        const { resolve, reject, command } = this.pendingCommand;

        if (response.responses && response.responses[0]) {
          const commandResponse = response.responses[0];
          if (commandResponse.error) {
            this.logger.error(
              'Command returned error',
              new Error(commandResponse.error),
              { command },
            );
            reject(new Error(commandResponse.error));
          } else {
            this.logger.debug('Command succeeded', { command });
            resolve(response);
          }
        } else {
          this.logger.debug('Command response received', { command });
          resolve(response);
        }
      } else {
        this.logger.warn('Response received but no pending command');
      }
    } catch (error) {
      this.logger.error('Failed to parse response', error);
    }
  }

  cleanup() {
    // Clear any pending commands
    if (this.pendingCommand) {
      this.pendingCommand.reject(new Error('Cleanup called'));
      this.pendingCommand = null;
    }
    // Clear queue
    this.commandQueue.forEach((cmd) => {
      cmd.reject(new Error('Cleanup called'));
    });
    this.commandQueue = [];
  }
}

module.exports = CommandExecutor;
