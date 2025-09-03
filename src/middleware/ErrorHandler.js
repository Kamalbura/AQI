/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the application.
 * Provides consistent error responses and logging.
 */

const loggerService = require('../services/LoggerService');
const configService = require('../services/ConfigService');

/**
 * Development error handler - includes stack traces
 */
function developmentErrorHandler(error, req, res, next) {
  const status = error.status || error.statusCode || 500;
  
  loggerService.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(status).json({
    success: false,
    error: {
      message: error.message,
      status,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Production error handler - no stack traces leaked to user
 */
function productionErrorHandler(error, req, res, next) {
  const status = error.status || error.statusCode || 500;
  
  loggerService.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const message = status === 500 ? 'Internal server error' : error.message;

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Main error handler
 */
function errorHandler(error, req, res, next) {
  // If response was already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: error.details || error.message,
        status: 400,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error.name === 'CastError' || error.name === 'TypeError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid request format',
        status: 400,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        message: 'File too large',
        status: 413,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid CSRF token',
        status: 403,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Rate limiting errors
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests',
        status: 429,
        retryAfter: error.retryAfter,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Use environment-appropriate error handler
  const isDevelopment = configService.isDevelopment();
  
  if (isDevelopment) {
    developmentErrorHandler(error, req, res, next);
  } else {
    productionErrorHandler(error, req, res, next);
  }
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Not Found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};