# Air Quality Monitoring System - Refactored

## Overview

This is a completely refactored and modernized version of the Air Quality Monitoring System. The refactoring implements modern software architecture principles including:

- **Single Responsibility Principle**: Each service has a clear, focused purpose
- **DRY (Don't Repeat Yourself)**: Eliminated code duplication and redundancy
- **Clear Separation of Concerns**: Clean separation between services, routes, and middleware
- **Centralized Configuration Management**: Single source of truth for all configuration
- **Modern Stack First**: React/TypeScript frontend with Node.js/Express backend

## Architecture

### Backend Services

- **ConfigService**: Centralized configuration management with environment variable support
- **ThingspeakService**: Clean ThingSpeak API integration with caching and retry logic
- **DataProcessingService**: Data validation, EPA AQI calculation, and aggregation
- **CacheService**: Redis-like caching with TTL and tagging support
- **LoggerService**: Structured logging with Winston

### API Design

- **RESTful endpoints** with consistent response format
- **Comprehensive error handling** with proper HTTP status codes
- **Rate limiting** and security middleware
- **Health check endpoints** for monitoring
- **Caching strategy** for performance optimization

### Frontend (To be implemented)

- Modern React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Chart.js for data visualization
- Real-time updates with WebSocket support

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- (Optional) Python 3.8+ for ML features

### Installation

1. **Clone and setup**:
   ```bash
   cd refactored-application
   npm run install:all
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your ThingSpeak credentials
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Build frontend**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   NODE_ENV=production npm start
   ```

## API Documentation

### Health Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Comprehensive health status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Data Endpoints

- `GET /api/data/latest` - Latest sensor readings
- `GET /api/data/feeds` - Feed data with filtering
- `GET /api/data/aggregated` - Aggregated data by time period
- `GET /api/data/aqi` - Current Air Quality Index

### System Endpoints

- `GET /api/status` - Service status
- `GET /api/config` - Configuration (sanitized)
- `POST /api/cache/clear` - Clear cache

### ThingSpeak Endpoints

- `GET /api/thingspeak/test` - Test connectivity
- `GET /api/thingspeak/info` - Channel information

## Configuration

Configuration is managed through the `ConfigService` which supports:

- **File-based configuration** (`config/app.json`)
- **Environment variable overrides** (prefixed with `AQM_`)
- **Validation** and error reporting
- **Hot reloading** for development

### Key Configuration Sections

- `server`: Port, host, and server settings
- `thingspeak`: API credentials and field mapping
- `cache`: Caching behavior and TTL settings
- `logging`: Log levels and output configuration
- `security`: CORS, rate limiting, and authentication

## Data Processing

The `DataProcessingService` provides:

- **Data validation** with configurable ranges
- **EPA AQI calculation** with official breakpoints
- **Air quality classification** using WHO guidelines
- **Comfort metrics** including heat index
- **Aggregation** by time periods (1h, 6h, 24h)
- **Outlier detection** (future feature)

## Monitoring and Observability

- **Structured logging** with Winston
- **Health checks** for all dependencies
- **Metrics collection** for performance monitoring
- **Error tracking** with stack traces (development only)
- **Cache statistics** and hit ratio monitoring

## Security Features

- **Helmet.js** for security headers
- **CORS** with configurable origins
- **Rate limiting** per IP address
- **Input validation** and sanitization
- **Error message sanitization** in production

## Performance Optimizations

- **Multi-level caching** with TTL and tagging
- **Data aggregation** to reduce client load
- **Compression** for HTTP responses
- **Connection pooling** for external APIs
- **Lazy loading** for non-critical features

## Development Tools

- **ESLint** for code quality
- **Jest** for testing
- **Nodemon** for development hot reload
- **Concurrently** for running multiple processes
- **Environment-specific configurations**

## Deployment Options

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
AQM_THINGSPEAK_CHANNEL_ID=your_channel_id
AQM_THINGSPEAK_READ_API_KEY=your_read_key
LOG_LEVEL=warn
ALLOWED_ORIGINS=https://yourdomain.com
```

## Monitoring and Alerts

Set up monitoring for:

- `/health/detailed` - Overall system health
- `/api/status` - Service-specific status
- `/health/metrics` - Performance metrics
- Application logs for errors and warnings

## Migration from Legacy System

This refactored version eliminates:

- ❌ **Multiple competing server entry points** (server.js, server-main.js, startup.js)
- ❌ **EJS templates and vanilla JavaScript** frontend
- ❌ **Scattered configuration files** and duplicate settings
- ❌ **Redundant service implementations**
- ❌ **Mixed architectural patterns**

And provides:

- ✅ **Single, clean server entry point**
- ✅ **Modern React/TypeScript frontend**
- ✅ **Centralized configuration service**
- ✅ **Consolidated, tested services**
- ✅ **Consistent architectural patterns**

## Future Enhancements

- **Real-time updates** with WebSocket
- **Machine learning** predictions with Python integration
- **User authentication** and personalized dashboards
- **Data export** and reporting features
- **Mobile app** with React Native
- **Database integration** for historical data
- **Alert system** for air quality thresholds

## Contributing

1. Follow the established architecture patterns
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commit messages
5. Ensure all health checks pass

## License

MIT License - see LICENSE file for details.