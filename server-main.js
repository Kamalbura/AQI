require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// Services & middleware (reuse existing implementation under src/)
const configService = require('./src/services/ConfigService');
const cacheService = require('./src/services/CacheService');
const { errorHandler, notFoundHandler } = require('./src/middleware/ErrorHandler');
const requestLogger = require('./src/middleware/RequestLogger');
const apiRoutes = require('./src/routes/api');
const healthRoutes = require('./src/routes/health');

const config = configService.getConfig();
const app = express();

// Core middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Basic rate limiter only on API
app.use('/api', rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max }));

// Routes
app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

// Static frontend (if built)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
  return res.sendFile(path.join(publicDir, 'index.html'), err => {
    if (err) next();
  });
});

// 404 + error handling
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info('Server started', { port: config.server.port, host: config.server.host, env: config.environment });
});

server.on('error', (err) => {
  logger.error('Server error', { error: err.message });
  process.exit(1);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down...`);
  server.close(() => {
    cacheService.close();
    logger.info('Shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn('Force exit after timeout');
    process.exit(1);
  }, config.server.shutdownTimeout || 10000).unref();
};
['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection', { reason }));
process.on('uncaughtException', (err) => { logger.error('Uncaught Exception', { error: err.message, stack: err.stack }); shutdown('uncaughtException'); });

module.exports = app;