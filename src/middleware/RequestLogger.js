/**
 * Request Logger Middleware
 * 
 * Logs HTTP requests and responses for monitoring and debugging.
 */

const loggerService = require('../services/LoggerService');

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to log when response is sent
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log the request
    loggerService.logRequest(req, res, responseTime);
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

module.exports = requestLogger;