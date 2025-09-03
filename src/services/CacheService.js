/**
 * Cache Service
 * 
 * Provides centralized caching functionality using node-cache.
 * Supports TTL, tagging, and statistics.
 */

const NodeCache = require('node-cache');
const configService = require('./ConfigService');
const loggerService = require('./LoggerService');

class CacheService {
  constructor() {
    this.config = configService.getSection('cache');
    this.logger = loggerService;
    
    this.cache = new NodeCache({
      stdTTL: this.config.ttl,
      checkperiod: this.config.checkPeriod,
      useClones: false,
      deleteOnExpire: true,
      enableLegacyCallbacks: false,
      maxKeys: this.config.maxKeys
    });

    this.tags = new Map(); // For cache tagging
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      flushes: 0
    };

    this.setupEventListeners();
  }

  /**
   * Setup cache event listeners
   */
  setupEventListeners() {
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      this.logger.debug(`Cache set: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      this.removeTags(key);
      this.logger.debug(`Cache delete: ${key}`);
    });

    this.cache.on('expired', (key, value) => {
      this.removeTags(key);
      this.logger.debug(`Cache expired: ${key}`);
    });

    this.cache.on('flush', () => {
      this.stats.flushes++;
      this.tags.clear();
      this.logger.debug('Cache flushed');
    });
  }

  /**
   * Get value from cache
   */
  get(key, category = 'default') {
    if (!this.config.enabled) {
      return undefined;
    }

    const fullKey = this.buildKey(key, category);
    const value = this.cache.get(fullKey);
    
    if (value !== undefined) {
      this.stats.hits++;
      this.logger.debug(`Cache hit: ${fullKey}`);
      return value;
    } else {
      this.stats.misses++;
      this.logger.debug(`Cache miss: ${fullKey}`);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null, category = 'default', tags = []) {
    if (!this.config.enabled) {
      return false;
    }

    const fullKey = this.buildKey(key, category);
    const cacheTtl = ttl || this.config.ttl;
    
    const success = this.cache.set(fullKey, value, cacheTtl);
    
    if (success && tags.length > 0) {
      this.setTags(fullKey, tags);
    }
    
    return success;
  }

  /**
   * Delete value from cache
   */
  del(key, category = 'default') {
    const fullKey = this.buildKey(key, category);
    return this.cache.del(fullKey);
  }

  /**
   * Check if key exists in cache
   */
  has(key, category = 'default') {
    const fullKey = this.buildKey(key, category);
    return this.cache.has(fullKey);
  }

  /**
   * Get multiple values
   */
  mget(keys, category = 'default') {
    const fullKeys = keys.map(key => this.buildKey(key, category));
    return this.cache.mget(fullKeys);
  }

  /**
   * Set multiple values
   */
  mset(keyValuePairs, ttl = null, category = 'default') {
    const pairs = keyValuePairs.map(({ key, value }) => ({
      key: this.buildKey(key, category),
      val: value,
      ttl: ttl || this.config.ttl
    }));
    
    return this.cache.mset(pairs);
  }

  /**
   * Get all keys
   */
  keys(category = null) {
    const allKeys = this.cache.keys();
    
    if (category) {
      const prefix = `${category}:`;
      return allKeys
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length));
    }
    
    return allKeys;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    
    return {
      ...this.stats,
      keys: cacheStats.keys,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      ksize: cacheStats.ksize,
      vsize: cacheStats.vsize
    };
  }

  /**
   * Flush all cache
   */
  flushAll() {
    this.cache.flushAll();
    this.tags.clear();
    this.resetStats();
  }

  /**
   * Flush cache by category
   */
  flushCategory(category) {
    const prefix = `${category}:`;
    const keys = this.cache.keys().filter(key => key.startsWith(prefix));
    
    keys.forEach(key => {
      this.cache.del(key);
    });
    
    this.logger.debug(`Flushed cache category: ${category} (${keys.length} keys)`);
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTag(tag) {
    const keys = this.getKeysByTag(tag);
    
    keys.forEach(key => {
      this.cache.del(key);
    });
    
    this.logger.debug(`Invalidated cache by tag: ${tag} (${keys.length} keys)`);
  }

  /**
   * Get TTL for a key
   */
  getTtl(key, category = 'default') {
    const fullKey = this.buildKey(key, category);
    return this.cache.getTtl(fullKey);
  }

  /**
   * Build full cache key
   */
  buildKey(key, category) {
    return `${category}:${key}`;
  }

  /**
   * Set tags for a key
   */
  setTags(key, tags) {
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(key);
    });
  }

  /**
   * Remove tags for a key
   */
  removeTags(key) {
    this.tags.forEach((keys, tag) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.tags.delete(tag);
      }
    });
  }

  /**
   * Get keys by tag
   */
  getKeysByTag(tag) {
    return Array.from(this.tags.get(tag) || []);
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      flushes: 0
    };
  }

  /**
   * Cache wrapper for functions
   */
  wrap(key, fn, ttl = null, category = 'default', tags = []) {
    return async (...args) => {
      const cacheKey = typeof key === 'function' ? key(...args) : key;
      const fullKey = this.buildKey(cacheKey, category);
      
      // Try to get from cache first
      let result = this.get(cacheKey, category);
      
      if (result === undefined) {
        // Execute function and cache result
        result = await fn(...args);
        this.set(cacheKey, result, ttl, category, tags);
      }
      
      return result;
    };
  }

  /**
   * Close cache service
   */
  close() {
    this.cache.close();
    this.logger.info('Cache service closed');
  }

  /**
   * Get service status
   */
  getStatus() {
    const stats = this.getStats();
    
    return {
      service: 'Cache',
      enabled: this.config.enabled,
      keys: stats.keys,
      hitRatio: Math.round(stats.hitRatio * 100) / 100,
      memoryUsage: {
        keys: stats.ksize,
        values: stats.vsize
      },
      config: {
        ttl: this.config.ttl,
        maxKeys: this.config.maxKeys,
        checkPeriod: this.config.checkPeriod
      }
    };
  }
}

module.exports = new CacheService();