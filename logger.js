// Backwards-compatible logger shim.
// All legacy imports now delegate to the structured Winston-based LoggerService.
// This prevents fragmentation while avoiding large refactors in one step.
const loggerService = require('./src/services/LoggerService');

module.exports = {
  error: (msg, meta) => loggerService.error(msg, meta),
  warn: (msg, meta) => loggerService.warn(msg, meta),
  info: (msg, meta) => loggerService.info(msg, meta),
  debug: (msg, meta) => loggerService.debug(msg, meta)
};
