/**
 * Centralized Configuration Service
 * 
 * Single source of truth for all application configuration.
 * Supports environment variables, validation, and hot reloading.
 */

const fs = require('fs');
const path = require('path');
// Lazy logger acquisition to avoid circular dependency (LoggerService -> ConfigService -> logger shim -> LoggerService)
// We only need logging for non-critical warnings/errors during config file IO.
function getLogger() {
  try {
    return require('../../logger');
  } catch (e) {
    return console; // Fallback during early bootstrap or in test environment
  }
}

class ConfigService {
  constructor() {
    this.config = null;
  // Updated to new canonical config filename app-config.json
  this.configPath = path.join(__dirname, '../../config/app-config.json');
    this.environmentPrefix = 'AQM_';
    this.loadConfig();
  }

  /**
   * Load configuration from file and environment variables
   */
  loadConfig() {
    // Default configuration
    const defaultConfig = {
      environment: process.env.NODE_ENV || 'development',
      
      server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || '0.0.0.0',
        shutdownTimeout: 10000
      },

      thingspeak: {
        baseUrl: 'https://api.thingspeak.com',
        // Channel & keys intentionally start as null; env overrides must provide values.
        channelId: process.env.AQM_THINGSPEAK_CHANNEL_ID || process.env.THINGSPEAK_CHANNEL_ID || null,
        readApiKey: process.env.AQM_THINGSPEAK_READ_API_KEY || process.env.THINGSPEAK_READ_API_KEY || null,
        writeApiKey: process.env.AQM_THINGSPEAK_WRITE_API_KEY || process.env.THINGSPEAK_WRITE_API_KEY || null,
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        fields: {
          humidity: 'field1',
          temperature: 'field2',
          pm25: 'field3',
          pm10: 'field4'
        }
      },

      database: {
        type: 'file', // 'file' or 'mongodb' (future)
        path: path.join(__dirname, '../../data/air_quality.db'),
        backupInterval: 3600000 // 1 hour
      },

      cache: {
        ttl: 300, // 5 minutes default
        maxKeys: 1000,
        checkPeriod: 60,
        enabled: true
      },

      cors: {
        allowedOrigins: (() => {
          // Support ALLOWED_ORIGINS env (comma separated) for runtime override
          const raw = process.env.AQM_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS;
          if (raw) {
            return raw.split(',').map(o => o.trim()).filter(Boolean);
          }
          return process.env.NODE_ENV === 'production'
            ? ['https://your-production-domain.com']
            : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];
        })()
      },

      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      },

      logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
          enabled: true,
          path: path.join(__dirname, '../../logs'),
          maxSize: '10MB',
          maxFiles: 5
        },
        console: {
          enabled: true,
          colorize: true
        }
      },

      dataProcessing: {
        batchSize: 1000,
        validationEnabled: true,
        aggregationPeriods: ['1h', '6h', '24h'],
        outlierDetection: {
          enabled: true,
          method: 'iqr', // 'iqr' or 'zscore'
          threshold: 2.5
        }
      },

      ml: {
        python: {
          enabled: false,
          scriptPath: path.join(__dirname, '../../python'),
          timeout: 30000
        },
        lstm: {
          sequenceLength: 24,
          predictionHours: 24,
          retrainInterval: 24 * 60 * 60 * 1000 // 24 hours
        }
      },

      security: {
        enableHttps: false,
        httpsOptions: {
          keyPath: '',
          certPath: ''
        },
        sessionSecret: process.env.SESSION_SECRET || process.env.AQM_SESSION_SECRET || 'dev-session-secret',
        jwtSecret: process.env.JWT_SECRET || process.env.AQM_JWT_SECRET || 'dev-jwt-secret',
        bcryptRounds: 12
      },

      monitoring: {
        healthCheck: {
          interval: 30000, // 30 seconds
          timeout: 5000
        },
        metrics: {
          enabled: true,
          retention: 24 * 60 * 60 * 1000 // 24 hours
        }
      }
    };

    // Load from file if exists
    let fileConfig = {};
    if (fs.existsSync(this.configPath)) {
      try {
        const configContent = fs.readFileSync(this.configPath, 'utf8');
        fileConfig = JSON.parse(configContent);
      } catch (error) {
  getLogger().warn('Could not load config file', { file: this.configPath, error: error.message });
      }
    }

    // Merge configurations: default < file < environment
    this.config = this.mergeDeep(defaultConfig, fileConfig);
    this.applyEnvironmentOverrides();
    // Ensure runtime NODE_ENV always takes precedence over file-config 'environment'
    if (process.env.NODE_ENV) {
      this.config.environment = process.env.NODE_ENV;
    }
    this.validateConfig();
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides() {
    const envMappings = {
      'PORT': 'server.port',
      'HOST': 'server.host',
      'AQM_THINGSPEAK_CHANNEL_ID': 'thingspeak.channelId',
      'AQM_THINGSPEAK_READ_API_KEY': 'thingspeak.readApiKey',
      'AQM_THINGSPEAK_WRITE_API_KEY': 'thingspeak.writeApiKey',
      // Legacy variable support for backward compatibility
      'THINGSPEAK_CHANNEL_ID': 'thingspeak.channelId',
      'THINGSPEAK_READ_API_KEY': 'thingspeak.readApiKey',
      'THINGSPEAK_WRITE_API_KEY': 'thingspeak.writeApiKey',
      'AQM_LOG_LEVEL': 'logging.level',
      'AQM_CACHE_TTL': 'cache.ttl',
      'AQM_RATE_LIMIT_MAX': 'rateLimit.max',
      'AQM_PYTHON_ENABLED': 'ml.python.enabled'
    };

    for (const [envVar, configPath] of Object.entries(envMappings)) {
      if (process.env[envVar]) {
        this.setNestedValue(this.config, configPath, this.parseValue(process.env[envVar]));
      }
    }

    // Special handling for allowed origins array override
    const originsRaw = process.env.AQM_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS;
    if (originsRaw) {
      this.config.cors.allowedOrigins = originsRaw.split(',').map(o => o.trim()).filter(Boolean);
    }
  }

  /**
   * Parse environment variable value to appropriate type
   */
  parseValue(value) {
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // String
    return value;
  }

  /**
   * Set nested object value using dot notation
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Deep merge objects
   */
  mergeDeep(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];
    this.warnings = [];

    // Required configurations
    const placeholderPattern = /^REPLACE_WITH/i;
    const isProd = (this.config.environment === 'production');

    if (!this.config.thingspeak.channelId) {
      errors.push('ThingSpeak channel ID is required');
    } else if (placeholderPattern.test(this.config.thingspeak.channelId)) {
      errors.push('ThingSpeak channel ID contains placeholder value');
    }

    if (!this.config.thingspeak.readApiKey) {
      if (isProd) {
        errors.push('ThingSpeak read API key is required');
      } else {
        this.warnings.push('ThingSpeak read API key not set; assuming public channel access (development mode)');
      }
    } else if (placeholderPattern.test(this.config.thingspeak.readApiKey)) {
      errors.push('ThingSpeak read API key contains placeholder value');
    }

    if (isProd) {
      // In production secrets must not be default dev fallbacks
      if (!this.config.security.sessionSecret || this.config.security.sessionSecret === 'dev-session-secret') {
        errors.push('SESSION_SECRET must be provided in production');
      }
      if (!this.config.security.jwtSecret || this.config.security.jwtSecret === 'dev-jwt-secret') {
        errors.push('JWT_SECRET must be provided in production');
      }
    }

    // Port validation
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push('Server port must be between 1 and 65535');
    }

    // Log level validation
    const validLogLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
    if (!validLogLevels.includes(this.config.logging.level)) {
      errors.push(`Invalid log level: ${this.config.logging.level}`);
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    if (this.warnings.length > 0) {
      this.warnings.forEach(w => getLogger().warn(w));
    }
  }

  /**
   * Get complete configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get configuration section
   */
  getSection(section) {
    return this.config[section];
  }

  /**
   * Get configuration value by path
   */
  getValue(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Update configuration section
   */
  updateSection(section, updates) {
    if (this.config[section]) {
      this.config[section] = { ...this.config[section], ...updates };
      this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * Save configuration to file
   */
  saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
  getLogger().error('Failed to save configuration', { error: error.message });
      return false;
    }
  }

  /**
   * Reload configuration
   */
  reload() {
    this.loadConfig();
  }

  /**
   * Get environment-specific configuration
   */
  isDevelopment() {
    return this.config.environment === 'development';
  }

  isProduction() {
    return this.config.environment === 'production';
  }

  isTest() {
    return this.config.environment === 'test';
  }
}

module.exports = new ConfigService();