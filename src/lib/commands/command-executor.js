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
    const Logger = require('../utils/logger');
    this.logger = new Logger({ component: 'CommandExecutor' }, options.loggerAdapter || null);

    // Sequential processing - only one command at a time
    this.pendingCommand = null;
    this.commandQueue = [];
    this.isProcessing = false;

    // Listen to responses
    this.connection.on('response', (message) => {
      try {
        this._handleResponse(message);
      } catch (e) {
        this.logger.error('Unhandled error in response handler', e);
      }
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
    // Use a deterministic promise.race between response and timeout so we avoid
    // double-resolve races when responses and timeout happen concurrently.
    return new Promise((resolve, reject) => {
      let finished = false;

      const onResolve = (res) => {
        if (finished) return;
        finished = true;
        resolve(res);
      };

      const onReject = (err) => {
        if (finished) return;
        finished = true;
        reject(err);
      };

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        if (finished) return;
        // Retry logic
        if (attempt < this.maxRetries) {
          this.logger.warn('Command timeout, retrying', { command, attempt });
          // Re-enqueue with increased attempt
          this.commandQueue.unshift({ command, payload, attempt: attempt + 1, resolve: onResolve, reject: onReject });
          // mark not processing so _processQueue can continue
          this.isProcessing = false;
          // process next
          this._processQueue();
        } else {
          const error = new TimeoutError(`Command ${command} timed out after ${this.timeout}ms`);
          this.logger.error('Command timeout exceeded retries', error, { command, attempt });
          onReject(error);
        }
      }, this.timeout);

      // Set pendingCommand to allow handler to resolve/reject it
      this.pendingCommand = {
        command,
        resolve: (response) => {
          clearTimeout(timeoutHandle);
          this.pendingCommand = null;
          onResolve(response);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          this.pendingCommand = null;
          onReject(error);
        },
      };

      try {
        this._sendCommand(command, payload);
      } catch (error) {
        clearTimeout(timeoutHandle);
        this.pendingCommand = null;
        onReject(error);
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
