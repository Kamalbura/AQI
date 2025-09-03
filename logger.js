// ----- BEGIN FILE: logger.js -----
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[LOG_LEVEL.toLowerCase()] ?? 2;

const log = (level, message, context = {}) => {
  if (levels[level] <= currentLevel) {
    const timestamp = new Date().toISOString();
    const ctx = context && Object.keys(context).length ? ' ' + JSON.stringify(context) : '';
    // eslint-disable-next-line no-console
    console.log(`${timestamp} [${level.toUpperCase()}]: ${message}${ctx}`);
  }
};

module.exports = {
  error: (message, context) => log('error', message, context),
  warn: (message, context) => log('warn', message, context),
  info: (message, context) => log('info', message, context),
  debug: (message, context) => log('debug', message, context)
};
// ----- END FILE: logger.js -----