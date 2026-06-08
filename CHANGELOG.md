# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-03-12

### Added
- **MQTT Protocol Support**: Now supports MQTT, MQTTS, WebSocket, and WebSocket TLS
- **TLS Configuration**: Support for CA certificates, client certificates, and client keys
- **Connection Timeouts**: Configurable reconnect period, connect timeout, and clean session
- **Enhanced Logging**: Pluggable logger adapter with configurable log levels (DEBUG/INFO/WARN/ERROR/NONE)
- **Command Retry Logic**: Automatic retry on timeout with configurable max retries
- **Visual Status Indicators**: Connection and execution status shown in Node-RED editor
- **Comprehensive Test Suite**: 70+ unit and integration tests covering edge cases

### Changed
- **Improved Error Handling**: Better validation and error messages
- **Cleaner Architecture**: Separated concerns with MQTTConnectionManager, CommandExecutor, and ValidationRegistry
- **Updated Dependencies**: Uses mqtt@5.x for modern MQTT support

### Fixed
- **Race Conditions**: Fixed potential race conditions in command execution and timeout handling
- **Response Parsing**: Improved handling of malformed responses and edge cases

## [0.0.0] - 2024-XX-XX (unreleased)

### Added
- Initial development version (unreleased)
