/**
 * Environment / Configuration Preflight Validator
 *
 * Runs explicit, user-friendly startup checks before the HTTP server binds.
 * Relies on ConfigService internal validation (which throws) but adds
 * richer guidance, warnings for non-fatal issues, and consolidated logging.
 */

const logger = require('../../src/services/LoggerService');
const configService = require('../services/ConfigService');

function runPreflightChecks() {
  logger.info('Running startup preflight checks');
  try {
    const config = configService.getConfig(); // Triggers internal validation.

    // Advisory warnings (non-fatal) -------------------------------------------------
    if (config.environment !== 'production') {
      if (config.security.sessionSecret === 'dev-session-secret') {
        logger.warn('Using development session secret. Set SESSION_SECRET / AQM_SESSION_SECRET for production.');
      }
      if (config.security.jwtSecret === 'dev-jwt-secret') {
        logger.warn('Using development JWT secret. Set JWT_SECRET / AQM_JWT_SECRET for production.');
      }
    }

    if (!config.cors.allowedOrigins || config.cors.allowedOrigins.length === 0) {
      logger.warn('CORS allowedOrigins is empty. Clients may be blocked. Provide ALLOWED_ORIGINS/AQM_ALLOWED_ORIGINS env.');
    }

    // Performance config sanity check
    if (config.cache.enabled && config.cache.ttl < 5) {
      logger.warn('Cache TTL is very low (<5s); may reduce effectiveness.');
    }

    logger.info('Preflight checks passed');
  } catch (error) {
    // Provide a clean, actionable error then exit.
    logger.error('Startup preflight failed. See details below.');
    logger.error(error.message);
    logger.error('Resolve configuration issues and restart the service.');
    process.exit(1); // Fail fast before binding port.
  }
}

module.exports = { runPreflightChecks };
