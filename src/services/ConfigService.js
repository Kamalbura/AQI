/**
 * Centralized Configuration Service
 * 
 * Single source of truth for all application configuration.
 * Supports environment variables, validation, and hot reloading.
 */

const fs = require('fs');
const path = require('path');

class ConfigService {
  constructor() {
    this.config = null;
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
        channelId: process.env.AQM_THINGSPEAK_CHANNEL_ID || '1957962',
        readApiKey: process.env.AQM_THINGSPEAK_READ_API_KEY || 'HZGMXUJP74HQ35V7',
        writeApiKey: process.env.AQM_THINGSPEAK_WRITE_API_KEY,
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
        allowedOrigins: process.env.NODE_ENV === 'production' 
          ? ['https://your-production-domain.com']
          : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']
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
        sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
        jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
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
        // Silent fallback to defaults; external logger not yet initialized here
      }
    }

    // Merge configurations: default < file < environment
    this.config = this.mergeDeep(defaultConfig, fileConfig);
    this.applyEnvironmentOverrides();
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

    // Required configurations
    if (!this.config.thingspeak.channelId) {
      errors.push('ThingSpeak channel ID is required');
    }

    if (!this.config.thingspeak.readApiKey) {
      errors.push('ThingSpeak read API key is required');
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
      console.error('Failed to save configuration:', error.message);
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