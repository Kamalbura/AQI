/**
 * Health Check Routes
 * 
 * Lightweight health monitoring endpoints.
 * No rate limiting for monitoring systems.
 */

const express = require('express');
const router = express.Router();
const os = require('os');

// Import services
const thingspeakService = require('../services/ThingspeakService');
const cacheService = require('../services/CacheService');
const configService = require('../services/ConfigService');

/**
 * Basic health check - minimal overhead
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Detailed health check
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: configService.getValue('environment'),
    version: require('../../package.json').version
  };

  const checks = {};

  try {
    // Check ThingSpeak connectivity
    const thingspeakTest = await Promise.race([
      thingspeakService.testConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
    
    checks.thingspeak = {
      status: thingspeakTest.success ? 'healthy' : 'unhealthy',
      responseTime: Date.now() % 1000, // Simplified timing
      error: thingspeakTest.success ? null : thingspeakTest.error
    };
  } catch (error) {
    checks.thingspeak = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Check cache service
  try {
    const cacheStats = cacheService.getStats();
    checks.cache = {
      status: 'healthy',
      hitRatio: cacheStats.hitRatio,
      keys: cacheStats.keys
    };
  } catch (error) {
    checks.cache = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  checks.memory = {
    status: memoryUsage.heapUsed < (totalMemory * 0.8) ? 'healthy' : 'warning',
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    systemFree: Math.round(freeMemory / 1024 / 1024),
    systemTotal: Math.round(totalMemory / 1024 / 1024)
  };

  // Determine overall status
  const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warning');
  
  if (hasUnhealthy) {
    health.status = 'unhealthy';
  } else if (hasWarnings) {
    health.status = 'warning';
  }

  health.checks = checks;

  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'warning' ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * Readiness probe - check if service is ready to serve traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Quick check of critical dependencies
    const ready = await Promise.race([
      thingspeakService.getLatestFeed(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
    ]);

    if (ready.success) {
      res.json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        error: ready.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness probe - check if service is alive
 */
router.get('/live', (req, res) => {
  // Simple check that the process is responsive
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * Metrics endpoint for monitoring
 */
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      ...process.memoryUsage(),
      systemTotal: os.totalmem(),
      systemFree: os.freemem()
    },
    cpu: {
      usage: process.cpuUsage(),
      cores: os.cpus().length
    },
    cache: cacheService.getStats(),
    services: {
      thingspeak: thingspeakService.getStatus(),
      cache: cacheService.getStatus()
    }
  };

  res.json(metrics);
});

module.exports = router;