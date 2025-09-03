// Canonical server entry point (replaces legacy server.js)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Internal modules
const configService = require('./src/services/ConfigService');
const cacheService = require('./src/services/CacheService');
const logger = require('./logger');
const { errorHandler } = require('./src/middleware/ErrorHandler');
const requestLogger = require('./src/middleware/RequestLogger');

// Routes
const apiRoutes = require('./src/routes/api');
const healthRoutes = require('./src/routes/health');

class AirQualityServer {
	constructor() {
		this.app = express();
		this.config = configService.getConfig();
		this.server = null;
	}

	async start() {
		try {
			this.setupMiddleware();
			this.setupRoutes();
			this.setupErrorHandling();
			await this.listen();
			logger.info('Air Quality Monitoring Server started', {
				port: this.config.server.port,
				environment: this.config.environment
			});
		} catch (err) {
			logger.error('Server failed to start', { error: err.message, stack: err.stack });
			process.exit(1);
		}
	}

	setupMiddleware() {
		this.app.use(helmet());
		this.app.use(cors({
			origin: this.config.cors.allowedOrigins,
			credentials: true
		}));
		this.app.use(compression());
		// Basic rate limiter for /api
		const limiter = rateLimit({
			windowMs: this.config.rateLimit.windowMs,
			max: this.config.rateLimit.max
		});
		this.app.use('/api', limiter);
		this.app.use(express.json({ limit: '5mb' }));
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(requestLogger);
		logger.debug('Middleware initialized');
	}

	setupRoutes() {
		this.app.use('/health', healthRoutes);
		this.app.use('/api', apiRoutes);
		logger.debug('Routes registered');
	}

	setupErrorHandling() {
		this.app.use((req, res, next) => {
			const err = new Error(`Not Found: ${req.originalUrl}`);
			err.status = 404;
			next(err);
		});
		this.app.use(errorHandler);
		process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
		process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
		process.on('unhandledRejection', (reason) => {
			logger.error('Unhandled Rejection', { reason });
		});
		process.on('uncaughtException', (error) => {
			logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
			this.gracefulShutdown('uncaughtException');
		});
	}

	listen() {
		return new Promise((resolve, reject) => {
			this.server = this.app.listen(this.config.server.port, this.config.server.host, (err) => {
				if (err) return reject(err);
				resolve();
			});
			this.server.on('error', (err) => {
				logger.error('HTTP server error', { error: err.message });
				reject(err);
			});
		});
	}

	gracefulShutdown(signal) {
		logger.warn('Graceful shutdown initiated', { signal });
		if (this.server) {
			this.server.close(() => {
				cacheService.close && cacheService.close();
				logger.info('Shutdown complete');
				process.exit(signal === 'uncaughtException' ? 1 : 0);
			});
			setTimeout(() => {
				logger.error('Forced shutdown after timeout');
				process.exit(1);
			}, this.config.server.shutdownTimeout || 10000);
		}
	}
}

if (require.main === module) {
	const server = new AirQualityServer();
	server.start();
}

module.exports = AirQualityServer;
