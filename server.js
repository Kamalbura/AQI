/**
 * Air Quality Monitoring System - Main Server
 * 
 * Centralized Express.js server implementing modern architecture:
 * - Single Responsibility Principle
 * - DRY (Don't Repeat Yourself)
 * - Clear Separation of Concerns
 * - Centralized Configuration Management
 * - Modern Stack First (React/TypeScript frontend, Node.js backend)
 */

require('dotenv').config();
// Run environment preflight validation before anything else binds a port
try {
  const { runPreflightChecks } = require('./src/startup/EnvironmentValidator');
  runPreflightChecks();
} catch (e) {
  // If validator threw synchronously (should exit internally), log as fallback
  console.error('Preflight validation failed early:', e.message);
  process.exit(1);
}
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import core services
const configService = require('./src/services/ConfigService');
const thingspeakService = require('./src/services/ThingspeakService');
const dataProcessingService = require('./src/services/DataProcessingService');
const cacheService = require('./src/services/CacheService');
const loggerService = require('./src/services/LoggerService');
const { errorHandler } = require('./src/middleware/ErrorHandler');
const requestLogger = require('./src/middleware/RequestLogger');

// Import route handlers
const apiRoutes = require('./src/routes/api');
const healthRoutes = require('./src/routes/health');

class AirQualityServer {
  constructor() {
    this.app = express();
    this.config = configService.getConfig();
    this.logger = loggerService;
    this.server = null;
  }

  /**
   * Initialize and start the server
   */
  async start() {
    try {
      await this.setupMiddleware();
      await this.setupRoutes();
      await this.setupErrorHandling();
      await this.startServer();
      
      this.logger.info('Air Quality Monitoring Server started successfully', {
        port: this.config.server.port,
        environment: this.config.environment,
        version: require('./package.json').version
      });
    } catch (error) {
      this.logger.error('Failed to start server', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }

  /**
   * Setup Express middleware
   */
  async setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.thingspeak.com"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Static files for React frontend
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    this.logger.info('Middleware setup completed');
  }

  /**
   * Setup application routes
   */
  async setupRoutes() {
    // Health check routes (no rate limiting)
    this.app.use('/health', healthRoutes);
    
    // API routes
    this.app.use('/api', apiRoutes);

    // Serve React application for all other routes (SPA routing)
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public/index.html'));
    });

    this.logger.info('Routes setup completed');
  }

  /**
   * Setup error handling
   */
  async setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      const error = new Error(`Not Found: ${req.originalUrl}`);
      error.status = 404;
      next(error);
    });

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown handlers
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      this.gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
    });

    this.logger.info('Error handling setup completed');
  }

  /**
   * Start the HTTP server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.server.port, this.config.server.host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          this.logger.error(`Port ${this.config.server.port} is already in use`);
        } else {
          this.logger.error('Server error', { error: error.message });
        }
        reject(error);
      });
    });
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    this.logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (this.server) {
      this.server.close(() => {
        this.logger.info('HTTP server closed');
        
        // Close database connections, clear caches, etc.
        cacheService.close();
        
        this.logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        this.logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, this.config.server.shutdownTimeout);
    } else {
      process.exit(0);
    }
  }

  /**
   * Get Express app instance (for testing)
   */
  getApp() {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new AirQualityServer();
  server.start();
}

module.exports = AirQualityServer;