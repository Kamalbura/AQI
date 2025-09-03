/**
 * API Routes
 * 
 * Central API endpoint handler with comprehensive functionality.
 * Implements all data retrieval, processing, and management endpoints.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Import services
const thingspeakService = require('../services/ThingspeakService');
const dataProcessingService = require('../services/DataProcessingService');
const cacheService = require('../services/CacheService');
const configService = require('../services/ConfigService');
const loggerService = require('../services/LoggerService');

// Create API-specific rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { error: 'Too many API requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all API routes
router.use(apiLimiter);

/**
 * API Information
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Air Quality Monitoring API',
    version: '1.0.0',
    description: 'Comprehensive air quality monitoring and analysis API',
    endpoints: {
      health: '/api/health',
      data: {
        latest: '/api/data/latest',
        feeds: '/api/data/feeds',
        aggregated: '/api/data/aggregated',
        aqi: '/api/data/aqi'
      },
      config: '/api/config',
      thingspeak: {
        test: '/api/thingspeak/test',
        info: '/api/thingspeak/info'
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * DATA ENDPOINTS
 */

// Get latest sensor readings
router.get('/data/latest', async (req, res) => {
  try {
    const result = await thingspeakService.getLatestFeed();
    
    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    // Process the data
    const processedData = dataProcessingService.processFeeds([result.data]);
    
    res.json({
      success: true,
      data: processedData[0],
      cached: result.cached,
      timestamp: new Date().toISOString()
    });

    loggerService.info('Latest data retrieved', { 
      cached: result.cached,
      entryId: result.data.entry_id 
    });

  } catch (error) {
    loggerService.error('Failed to get latest data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get feed data with optional filtering
router.get('/data/feeds', async (req, res) => {
  try {
    const {
      results = 100,
      days = null,
      start = null,
      end = null,
      aggregate = null
    } = req.query;

    // Validate parameters
    const parsedResults = Math.min(parseInt(results) || 100, 1000); // Max 1000 results
    
    const result = await thingspeakService.getFeeds({
      results: parsedResults,
      days: days ? parseInt(days) : null,
      start,
      end
    });

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    // Process the feeds
    let processedFeeds = dataProcessingService.processFeeds(result.data.feeds);

    // Apply aggregation if requested
    if (aggregate && ['1h', '6h', '24h'].includes(aggregate)) {
      processedFeeds = dataProcessingService.aggregateData(processedFeeds, aggregate);
    }

    res.json({
      success: true,
      data: {
        feeds: processedFeeds,
        channel: result.data.channel,
        count: processedFeeds.length,
        aggregated: !!aggregate
      },
      cached: result.cached,
      timestamp: new Date().toISOString()
    });

    loggerService.info('Feeds data retrieved', { 
      count: processedFeeds.length,
      aggregated: !!aggregate,
      cached: result.cached 
    });

  } catch (error) {
    loggerService.error('Failed to get feeds data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get aggregated data for different time periods
router.get('/data/aggregated', async (req, res) => {
  try {
    const { period = '1h', results = 200 } = req.query;
    
    // Validate period
    if (!['1h', '6h', '24h'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be one of: 1h, 6h, 24h',
        timestamp: new Date().toISOString()
      });
    }

    const cacheKey = `aggregated:${period}:${results}`;
    let cachedData = cacheService.get(cacheKey, 'data');
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        period,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get feeds data
    const feedsResult = await thingspeakService.getFeeds({
      results: parseInt(results) || 200
    });

    if (!feedsResult.success) {
      return res.status(503).json({
        success: false,
        error: feedsResult.error,
        timestamp: new Date().toISOString()
      });
    }

    // Process and aggregate
    const processedFeeds = dataProcessingService.processFeeds(feedsResult.data.feeds);
    const aggregatedData = dataProcessingService.aggregateData(processedFeeds, period);

    // Cache for 5 minutes
    cacheService.set(cacheKey, aggregatedData, 300, 'data');

    res.json({
      success: true,
      data: aggregatedData,
      period,
      cached: false,
      timestamp: new Date().toISOString()
    });

    loggerService.info('Aggregated data retrieved', { 
      period, 
      count: aggregatedData.length 
    });

  } catch (error) {
    loggerService.error('Failed to get aggregated data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get current AQI information
router.get('/data/aqi', async (req, res) => {
  try {
    const cacheKey = 'current:aqi';
    let cachedAqi = cacheService.get(cacheKey, 'quick');
    
    if (cachedAqi) {
      return res.json({
        success: true,
        data: cachedAqi,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get latest data
    const result = await thingspeakService.getLatestFeed();
    
    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: 'Unable to retrieve current air quality data',
        timestamp: new Date().toISOString()
      });
    }

    // Process data to get AQI
    const processedData = dataProcessingService.processFeeds([result.data]);
    const latestData = processedData[0];

    const aqiData = {
      aqi: latestData.epaAqi,
      airQuality: latestData.airQuality,
      measurements: {
        pm25: latestData.pm25,
        pm10: latestData.pm10,
        temperature: latestData.temperature,
        humidity: latestData.humidity
      },
      comfort: latestData.comfort,
      timestamp: latestData.created_at
    };

    // Cache for 1 minute
    cacheService.set(cacheKey, aqiData, 60, 'quick');

    res.json({
      success: true,
      data: aqiData,
      cached: false,
      timestamp: new Date().toISOString()
    });

    loggerService.info('AQI data retrieved', { 
      aqi: aqiData.aqi?.value,
      category: aqiData.aqi?.category?.name 
    });

  } catch (error) {
    loggerService.error('Failed to get AQI data', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * THINGSPEAK ENDPOINTS
 */

// Test ThingSpeak connectivity
router.get('/thingspeak/test', async (req, res) => {
  try {
    const result = await thingspeakService.testConnection();
    
    res.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString()
    });

    loggerService.info('ThingSpeak connectivity test', { success: result.success });

  } catch (error) {
    loggerService.error('ThingSpeak test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get ThingSpeak channel information
router.get('/thingspeak/info', async (req, res) => {
  try {
    const result = await thingspeakService.getChannelInfo();
    
    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.data,
      cached: result.cached,
      timestamp: new Date().toISOString()
    });

    loggerService.info('ThingSpeak channel info retrieved', { 
      cached: result.cached 
    });

  } catch (error) {
    loggerService.error('Failed to get ThingSpeak info', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * CONFIGURATION ENDPOINTS
 */

// Get application configuration (sanitized)
router.get('/config', (req, res) => {
  try {
    const config = configService.getConfig();
    
    // Create sanitized copy for API response
    const sanitizedConfig = {
      environment: config.environment,
      server: {
        port: config.server.port,
        host: config.server.host
      },
      thingspeak: {
        channelId: config.thingspeak.channelId,
        hasReadKey: !!config.thingspeak.readApiKey,
        hasWriteKey: !!config.thingspeak.writeApiKey,
        fields: config.thingspeak.fields
      },
      cache: {
        enabled: config.cache.enabled,
        ttl: config.cache.ttl
      },
      logging: {
        level: config.logging.level
      }
    };

    res.json({
      success: true,
      data: sanitizedConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggerService.error('Failed to get configuration', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * SYSTEM ENDPOINTS
 */

// Get service status
router.get('/status', (req, res) => {
  try {
    const status = {
      services: {
        thingspeak: thingspeakService.getStatus(),
        dataProcessing: dataProcessingService.getStatus(),
        cache: cacheService.getStatus(),
        logger: loggerService.getStatus()
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggerService.error('Failed to get system status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Clear cache
router.post('/cache/clear', (req, res) => {
  try {
    const { category } = req.body;
    
    if (category) {
      cacheService.flushCategory(category);
      loggerService.info(`Cache cleared for category: ${category}`);
    } else {
      cacheService.flushAll();
      loggerService.info('All cache cleared');
    }

    res.json({
      success: true,
      message: category ? `Cache cleared for category: ${category}` : 'All cache cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    loggerService.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * ERROR HANDLING
 */

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler for API routes
router.use((error, req, res, next) => {
  loggerService.error('API error', { 
    error: error.message, 
    stack: error.stack,
    path: req.originalUrl,
    method: req.method
  });

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;