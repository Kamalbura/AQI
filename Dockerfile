# Multi-stage build for production-ready air quality monitoring app
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Backend production image
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-torch \
    py3-numpy \
    py3-pandas \
    && ln -sf python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package*.json ./
RUN npm ci --only=production

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY src/ ./src/
COPY server.js ./
# NOTE: Do NOT bake any .env file into the image.
# Environment configuration must be supplied at runtime via docker run -e / compose / orchestrator secrets.

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./public

# Create necessary directories
RUN mkdir -p logs data/uploads data/exports data/state

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]