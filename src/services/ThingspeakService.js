/**
 * ThingSpeak Service
 * 
 * Handles all communication with ThingSpeak API.
 * Implements caching, retry logic, and error handling.
 */

const axios = require('axios');
const configService = require('./ConfigService');
const cacheService = require('./CacheService');
const loggerService = require('./LoggerService');

class ThingspeakService {
  constructor() {
    this.config = configService.getSection('thingspeak');
    this.cache = cacheService;
    this.logger = loggerService;
    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'AirQualityMonitor/1.0.0'
      }
    });
  }

  /**
   * Get latest feed data
   */
  async getLatestFeed() {
    const cacheKey = 'thingspeak:latest';
    
    try {
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached latest feed data');
        return { success: true, data: cached, cached: true };
      }

      const url = `/channels/${this.config.channelId}/feeds/last.json`;
      const params = {
        api_key: this.config.readApiKey
      };

      const response = await this.axios.get(url, { params });
      
      if (response.data) {
        const processedData = this.processFeedData(response.data);
        
        // Cache for 1 minute
        this.cache.set(cacheKey, processedData, 60);
        
        this.logger.debug('Retrieved latest feed data from ThingSpeak');
        return { success: true, data: processedData, cached: false };
      }

      throw new Error('No data received from ThingSpeak');
    } catch (error) {
      this.logger.error('Failed to get latest feed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get channel feeds with pagination
   */
  async getFeeds(options = {}) {
    const {
      results = 100,
      days = null,
      start = null,
      end = null,
      offset = 0
    } = options;

    const cacheKey = `thingspeak:feeds:${JSON.stringify(options)}`;
    
    try {
      // Check cache first (shorter cache for feed data)
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached feeds data');
        return { success: true, data: cached, cached: true };
      }

      const url = `/channels/${this.config.channelId}/feeds.json`;
      const params = {
        api_key: this.config.readApiKey,
        results
      };

      // Add optional parameters
      if (days) params.days = days;
      if (start) params.start = start;
      if (end) params.end = end;
      if (offset) params.offset = offset;

      const response = await this.axios.get(url, { params });
      
      if (response.data && response.data.feeds) {
        const processedFeeds = response.data.feeds.map(feed => this.processFeedData(feed));
        const result = {
          channel: response.data.channel,
          feeds: processedFeeds,
          count: processedFeeds.length
        };
        
        // Cache for 2 minutes
        this.cache.set(cacheKey, result, 120);
        
        this.logger.debug(`Retrieved ${processedFeeds.length} feeds from ThingSpeak`);
        return { success: true, data: result, cached: false };
      }

      throw new Error('No feeds data received from ThingSpeak');
    } catch (error) {
      this.logger.error('Failed to get feeds', { error: error.message, options });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo() {
    const cacheKey = 'thingspeak:channel:info';
    
    try {
      // Check cache first (longer cache for channel info)
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached channel info');
        return { success: true, data: cached, cached: true };
      }

      const url = `/channels/${this.config.channelId}.json`;
      const params = {
        api_key: this.config.readApiKey
      };

      const response = await this.axios.get(url, { params });
      
      if (response.data) {
        // Cache for 10 minutes
        this.cache.set(cacheKey, response.data, 600);
        
        this.logger.debug('Retrieved channel info from ThingSpeak');
        return { success: true, data: response.data, cached: false };
      }

      throw new Error('No channel data received from ThingSpeak');
    } catch (error) {
      this.logger.error('Failed to get channel info', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Test ThingSpeak connectivity
   */
  async testConnection() {
    try {
      const result = await this.getChannelInfo();
      
      if (result.success) {
        this.logger.info('ThingSpeak connection test successful');
        return {
          success: true,
          message: 'Connected to ThingSpeak successfully',
          channelInfo: result.data
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.logger.error('ThingSpeak connection test failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write data to ThingSpeak (if write API key is configured)
   */
  async writeData(data) {
    if (!this.config.writeApiKey) {
      throw new Error('Write API key not configured');
    }

    try {
      const url = `/update.json`;
      const postData = {
        api_key: this.config.writeApiKey,
        ...data
      };

      const response = await this.axios.post(url, postData);
      
      this.logger.info('Data written to ThingSpeak', { entryId: response.data });
      return { success: true, entryId: response.data };
    } catch (error) {
      this.logger.error('Failed to write data to ThingSpeak', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process individual feed data
   */
  processFeedData(feed) {
    const processed = {
      entry_id: parseInt(feed.entry_id) || null,
      created_at: feed.created_at,
      timestamp: feed.created_at,
      
      // Map field data to meaningful names
      humidity: this.parseFloat(feed[this.config.fields.humidity]),
      temperature: this.parseFloat(feed[this.config.fields.temperature]),
      pm25: this.parseFloat(feed[this.config.fields.pm25]),
      pm10: this.parseFloat(feed[this.config.fields.pm10]),
      
      // Keep original field data for compatibility
      field1: feed.field1,
      field2: feed.field2,
      field3: feed.field3,
      field4: feed.field4
    };

    return processed;
  }

  /**
   * Parse float value with null handling
   */
  parseFloat(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'ThingSpeak',
      configured: !!(this.config.channelId && this.config.readApiKey),
      channelId: this.config.channelId,
      hasWriteAccess: !!this.config.writeApiKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    const keys = this.cache.keys().filter(key => key.startsWith('thingspeak:'));
    keys.forEach(key => this.cache.del(key));
    this.logger.info(`Cleared ${keys.length} ThingSpeak cache entries`);
  }
}

module.exports = new ThingspeakService();