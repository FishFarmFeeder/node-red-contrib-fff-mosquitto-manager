module.exports = function (RED) {
  require('./nodes/mosquitto-config')(RED);
  require('./nodes/mosquitto-manager')(RED);
};
