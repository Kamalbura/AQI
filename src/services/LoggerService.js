/**
 * Logger Service
 * 
 * Centralized logging functionality using Winston.
 * Supports multiple transports and log levels.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const configService = require('./ConfigService');

class LoggerService {
  constructor() {
    this.config = configService.getSection('logging');
    this.logger = null;
    this.setupLogger();
  }

  /**
   * Setup Winston logger
   */
  setupLogger() {
    const transports = [];
    
    // Console transport
    if (this.config.console.enabled) {
      transports.push(new winston.transports.Console({
        level: this.config.level,
        format: winston.format.combine(
          winston.format.colorize({ all: this.config.console.colorize }),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let log = `${timestamp} [${level}]: ${message}`;
            
            // Add metadata if present
            if (Object.keys(meta).length > 0) {
              log += ' ' + JSON.stringify(meta);
            }
            
            return log;
          })
        )
      }));
    }

    // File transport
    if (this.config.file.enabled) {
      // Ensure log directory exists
      this.ensureLogDirectory();
      
      // Combined log file
      transports.push(new winston.transports.File({
        filename: path.join(this.config.file.path, 'combined.log'),
        level: this.config.level,
        maxsize: this.parseSize(this.config.file.maxSize),
        maxFiles: this.config.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      }));

      // Error log file
      transports.push(new winston.transports.File({
        filename: path.join(this.config.file.path, 'error.log'),
        level: 'error',
        maxsize: this.parseSize(this.config.file.maxSize),
        maxFiles: this.config.file.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        )
      }));
    }

    this.logger = winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({ 
        filename: path.join(this.config.file.path, 'exceptions.log') 
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({ 
        filename: path.join(this.config.file.path, 'rejections.log') 
      })
    );
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.config.file.path)) {
      fs.mkdirSync(this.config.file.path, { recursive: true });
    }
  }

  /**
   * Parse file size string to bytes
   */
  parseSize(sizeStr) {
    const size = parseFloat(sizeStr);
    const unit = sizeStr.replace(/[0-9.]/g, '').toUpperCase();
    
    switch (unit) {
      case 'KB': return size * 1024;
      case 'MB': return size * 1024 * 1024;
      case 'GB': return size * 1024 * 1024 * 1024;
      default: return size;
    }
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log verbose message
   */
  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log silly message
   */
  silly(message, meta = {}) {
    this.logger.silly(message, meta);
  }

  /**
   * Create child logger with default metadata
   */
  child(defaultMeta = {}) {
    return {
      error: (message, meta = {}) => this.error(message, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      verbose: (message, meta = {}) => this.verbose(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta }),
      silly: (message, meta = {}) => this.silly(message, { ...defaultMeta, ...meta })
    };
  }

  /**
   * Log HTTP request
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 400) {
      this.warn(`HTTP ${res.statusCode} ${req.method} ${req.url}`, meta);
    } else {
      this.info(`HTTP ${res.statusCode} ${req.method} ${req.url}`, meta);
    }
  }

  /**
   * Log database query
   */
  logQuery(query, duration, result) {
    this.debug('Database query', {
      query,
      duration,
      resultCount: Array.isArray(result) ? result.length : 1
    });
  }

  /**
   * Log API call
   */
  logApiCall(service, endpoint, duration, success, error = null) {
    const meta = {
      service,
      endpoint,
      duration,
      success
    };

    if (error) {
      meta.error = error;
    }

    if (success) {
      this.info(`API call successful: ${service}${endpoint}`, meta);
    } else {
      this.error(`API call failed: ${service}${endpoint}`, meta);
    }
  }

  /**
   * Get log level
   */
  getLevel() {
    return this.logger.level;
  }

  /**
   * Set log level
   */
  setLevel(level) {
    this.logger.level = level;
    this.logger.transports.forEach(transport => {
      transport.level = level;
    });
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'Logger',
      level: this.logger.level,
      transports: this.logger.transports.map(transport => ({
        type: transport.constructor.name,
        level: transport.level,
        filename: transport.filename || null
      })),
      config: this.config
    };
  }

  /**
   * Close logger and flush pending logs
   */
  close() {
    return new Promise((resolve) => {
      this.logger.end(() => {
        resolve();
      });
    });
  }
}

module.exports = new LoggerService();