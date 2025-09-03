# Air Quality Monitoring System - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Python 3.8+ (for ML features)
- Docker (optional, for containerized deployment)

### Local Development
```bash
# Clone and navigate to the project
cd refactored-application

# Install dependencies and start
node start.js

# Or manual setup:
npm install
cd frontend && npm install && npm run build && cd ..
npm start
```

### Production Deployment

#### Option 1: Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Check status
docker-compose ps
docker-compose logs -f air-quality-app
```

#### Option 2: PM2 (Node.js Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 status
pm2 logs air-quality-app
```

#### Option 3: Systemd Service (Linux)
```bash
# Copy service file
sudo cp deployment/air-quality.service /etc/systemd/system/

# Enable and start
sudo systemctl enable air-quality
sudo systemctl start air-quality
sudo systemctl status air-quality
```

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```env
# ThingSpeak API Configuration
THINGSPEAK_READ_API_KEY=your_read_api_key
THINGSPEAK_CHANNEL_ID=your_channel_id

# Server Configuration
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Cache Configuration
CACHE_TTL=300
CACHE_MAX_SIZE=1000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### ThingSpeak Setup
1. Create account at [ThingSpeak.com](https://thingspeak.com)
2. Create a new channel for air quality data
3. Configure fields:
   - Field 1: PM2.5 (μg/m³)
   - Field 2: PM10 (μg/m³)
   - Field 3: Temperature (°C)
   - Field 4: Humidity (%)
   - Field 5: AQI (calculated)
4. Get your Channel ID and Read API Key
5. Update `.env` file with your credentials

## 📊 Monitoring & Health Checks

### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

### Metrics (Optional)
If using Prometheus monitoring:
- Metrics endpoint: `http://localhost:3000/metrics`
- Prometheus UI: `http://localhost:9090`

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default ports
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Use environment-specific API keys
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set secure headers
- [ ] Use non-root user in containers
- [ ] Regular security updates

### SSL/HTTPS Setup
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com

# Or use reverse proxy (nginx/Apache)
# See deployment/nginx.conf for example
```

## 🚀 Performance Optimization

### Recommended Settings
- Enable gzip compression
- Use CDN for static assets
- Configure caching headers
- Optimize database queries
- Monitor memory usage
- Set up load balancing for high traffic

### Scaling Options
1. **Horizontal Scaling**: Multiple app instances behind load balancer
2. **Database Optimization**: Redis for caching, PostgreSQL for persistence
3. **CDN**: CloudFlare, AWS CloudFront for static assets
4. **Container Orchestration**: Kubernetes for auto-scaling

## 🛠 Troubleshooting

### Common Issues

#### App Won't Start
```bash
# Check Node.js version
node --version  # Should be 16+

# Check port availability
netstat -tulpn | grep :3000

# Check logs
tail -f logs/app.log
```

#### Frontend Not Loading
```bash
# Rebuild frontend
cd frontend
npm run build
cd ..

# Check public directory
ls -la public/
```

#### API Errors
```bash
# Test ThingSpeak connection
curl "https://api.thingspeak.com/channels/YOUR_CHANNEL_ID/feeds.json?api_key=YOUR_API_KEY&results=1"

# Check API health
curl http://localhost:3000/api/health
```

#### Memory Issues
```bash
# Check memory usage
free -h
docker stats  # If using Docker

# Restart service
pm2 restart air-quality-app
# or
docker-compose restart air-quality-app
```

### Backup & Recovery
```bash
# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz data/ config/ logs/

# Restore data
tar -xzf backup-20240101.tar.gz
```

## 📱 Mobile & PWA

The application includes Progressive Web App (PWA) features:
- Offline support
- Mobile-responsive design
- App-like experience
- Push notifications (when configured)

To install as mobile app:
1. Open in mobile browser
2. Tap "Add to Home Screen"
3. Launch from home screen

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Backup current version
cp -r . ../air-quality-backup-$(date +%Y%m%d)

# Pull updates (if using git)
git pull origin main

# Update dependencies
npm update
cd frontend && npm update && cd ..

# Rebuild and restart
npm run build
pm2 restart air-quality-app
```

### Database Maintenance
```bash
# Clean old logs (keep last 30 days)
find logs/ -name "*.log" -mtime +30 -delete

# Archive old data
node scripts/archive-data.js

# Optimize database (if using SQLite)
sqlite3 data/app.db "VACUUM;"
```

## 📞 Support

For issues and support:
1. Check logs in `logs/` directory
2. Review this deployment guide
3. Check GitHub issues
4. Create new issue with:
   - System information
   - Error logs
   - Steps to reproduce

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Note**: This is a production-ready deployment guide. Adjust configurations based on your specific environment and requirements.