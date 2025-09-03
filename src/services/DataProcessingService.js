/**
 * Data Processing Service
 * 
 * Handles data validation, transformation, aggregation, and analysis.
 * Implements EPA AQI calculations and air quality classifications.
 */

const moment = require('moment');
const configService = require('./ConfigService');
const loggerService = require('./LoggerService');

class DataProcessingService {
  constructor() {
    this.config = configService.getSection('dataProcessing');
    this.logger = loggerService;
    
    // Air quality thresholds (WHO guidelines)
    this.aqiThresholds = {
      pm25: {
        good: 12,
        moderate: 35.4,
        unhealthySensitive: 55.4,
        unhealthy: 150.4,
        veryUnhealthy: 250.4,
        hazardous: 500.4
      },
      pm10: {
        good: 54,
        moderate: 154,
        unhealthySensitive: 254,
        unhealthy: 354,
        veryUnhealthy: 424,
        hazardous: 604
      }
    };

    // EPA AQI breakpoints for PM2.5
    this.epaBreakpoints = [
      { min: 0.0, max: 12.0, aqiMin: 0, aqiMax: 50 },
      { min: 12.1, max: 35.4, aqiMin: 51, aqiMax: 100 },
      { min: 35.5, max: 55.4, aqiMin: 101, aqiMax: 150 },
      { min: 55.5, max: 150.4, aqiMin: 151, aqiMax: 200 },
      { min: 150.5, max: 250.4, aqiMin: 201, aqiMax: 300 },
      { min: 250.5, max: 500.4, aqiMin: 301, aqiMax: 500 }
    ];
  }

  /**
   * Process raw feed data
   */
  processFeeds(feeds) {
    if (!Array.isArray(feeds)) {
      this.logger.warn('processFeeds: Input is not an array');
      return [];
    }

    const processed = feeds.map(feed => this.processSingleFeed(feed));
    
    this.logger.debug(`Processed ${processed.length} feeds`);
    return processed;
  }

  /**
   * Process a single feed entry
   */
  processSingleFeed(feed) {
    const processed = {
      ...feed,
      valid: true,
      validationErrors: [],
      airQuality: {},
      comfort: {},
      epaAqi: null
    };

    // Validate and process each sensor reading
    this.validateSensorData(processed);
    
    // Calculate air quality classifications
    if (processed.pm25 !== null) {
      processed.airQuality.pm25 = this.classifyPM25(processed.pm25);
      processed.epaAqi = this.calculateEpaAqi(processed.pm25);
    }
    
    if (processed.pm10 !== null) {
      processed.airQuality.pm10 = this.classifyPM10(processed.pm10);
    }

    // Calculate overall air quality
    processed.airQuality.overall = this.calculateOverallAQI(processed);

    // Calculate comfort metrics
    if (processed.temperature !== null && processed.humidity !== null) {
      processed.comfort = this.calculateComfort(processed.temperature, processed.humidity);
    }

    return processed;
  }

  /**
   * Validate sensor data
   */
  validateSensorData(feed) {
    const validRanges = {
      temperature: { min: -40, max: 60 },
      humidity: { min: 0, max: 100 },
      pm25: { min: 0, max: 1000 },
      pm10: { min: 0, max: 2000 }
    };

    for (const [field, range] of Object.entries(validRanges)) {
      const value = feed[field];
      
      if (value !== null && value !== undefined) {
        if (typeof value !== 'number' || isNaN(value)) {
          feed.validationErrors.push(`${field}: Invalid numeric value`);
          feed.valid = false;
        } else if (value < range.min || value > range.max) {
          feed.validationErrors.push(`${field}: Value ${value} outside valid range ${range.min}-${range.max}`);
          feed.valid = false;
        }
      }
    }

    // Check timestamp
    if (feed.created_at) {
      const timestamp = moment(feed.created_at);
      if (!timestamp.isValid()) {
        feed.validationErrors.push('Invalid timestamp format');
        feed.valid = false;
      }
    }
  }

  /**
   * Calculate EPA AQI for PM2.5
   */
  calculateEpaAqi(pm25) {
    if (pm25 === null || pm25 === undefined || isNaN(pm25)) {
      return null;
    }

    for (const bp of this.epaBreakpoints) {
      if (pm25 >= bp.min && pm25 <= bp.max) {
        const aqi = Math.round(
          ((bp.aqiMax - bp.aqiMin) / (bp.max - bp.min)) * (pm25 - bp.min) + bp.aqiMin
        );
        
        return {
          value: aqi,
          category: this.getAqiCategory(aqi),
          pm25Value: pm25
        };
      }
    }

    // Handle extreme values
    if (pm25 > 500.4) {
      return {
        value: 500,
        category: this.getAqiCategory(500),
        pm25Value: pm25
      };
    }

    return null;
  }

  /**
   * Get AQI category information
   */
  getAqiCategory(aqi) {
    if (aqi <= 50) {
      return {
        name: 'Good',
        color: '#00E400',
        description: 'Air quality is satisfactory',
        healthAdvice: 'Enjoy outdoor activities'
      };
    } else if (aqi <= 100) {
      return {
        name: 'Moderate',
        color: '#FFFF00',
        description: 'Air quality is acceptable',
        healthAdvice: 'Sensitive individuals should consider limiting prolonged outdoor exertion'
      };
    } else if (aqi <= 150) {
      return {
        name: 'Unhealthy for Sensitive Groups',
        color: '#FF7E00',
        description: 'Sensitive groups may experience health effects',
        healthAdvice: 'Sensitive groups should reduce outdoor activities'
      };
    } else if (aqi <= 200) {
      return {
        name: 'Unhealthy',
        color: '#FF0000',
        description: 'Everyone may experience health effects',
        healthAdvice: 'Everyone should reduce outdoor activities'
      };
    } else if (aqi <= 300) {
      return {
        name: 'Very Unhealthy',
        color: '#8F3F97',
        description: 'Health alert for everyone',
        healthAdvice: 'Everyone should avoid outdoor activities'
      };
    } else {
      return {
        name: 'Hazardous',
        color: '#7E0023',
        description: 'Emergency conditions',
        healthAdvice: 'Everyone should stay indoors'
      };
    }
  }

  /**
   * Classify PM2.5 levels
   */
  classifyPM25(value) {
    const thresholds = this.aqiThresholds.pm25;
    
    if (value <= thresholds.good) {
      return { level: 'good', description: 'Good', color: '#00E400' };
    } else if (value <= thresholds.moderate) {
      return { level: 'moderate', description: 'Moderate', color: '#FFFF00' };
    } else if (value <= thresholds.unhealthySensitive) {
      return { level: 'unhealthy_sensitive', description: 'Unhealthy for Sensitive Groups', color: '#FF7E00' };
    } else if (value <= thresholds.unhealthy) {
      return { level: 'unhealthy', description: 'Unhealthy', color: '#FF0000' };
    } else if (value <= thresholds.veryUnhealthy) {
      return { level: 'very_unhealthy', description: 'Very Unhealthy', color: '#8F3F97' };
    } else {
      return { level: 'hazardous', description: 'Hazardous', color: '#7E0023' };
    }
  }

  /**
   * Classify PM10 levels
   */
  classifyPM10(value) {
    const thresholds = this.aqiThresholds.pm10;
    
    if (value <= thresholds.good) {
      return { level: 'good', description: 'Good', color: '#00E400' };
    } else if (value <= thresholds.moderate) {
      return { level: 'moderate', description: 'Moderate', color: '#FFFF00' };
    } else if (value <= thresholds.unhealthySensitive) {
      return { level: 'unhealthy_sensitive', description: 'Unhealthy for Sensitive Groups', color: '#FF7E00' };
    } else if (value <= thresholds.unhealthy) {
      return { level: 'unhealthy', description: 'Unhealthy', color: '#FF0000' };
    } else if (value <= thresholds.veryUnhealthy) {
      return { level: 'very_unhealthy', description: 'Very Unhealthy', color: '#8F3F97' };
    } else {
      return { level: 'hazardous', description: 'Hazardous', color: '#7E0023' };
    }
  }

  /**
   * Calculate overall air quality index
   */
  calculateOverallAQI(data) {
    let maxAqi = 0;
    let dominantPollutant = null;
    let category = null;

    // Check PM2.5
    if (data.epaAqi && data.epaAqi.value > maxAqi) {
      maxAqi = data.epaAqi.value;
      dominantPollutant = 'PM2.5';
      category = data.epaAqi.category;
    }

    // Check PM10 (simplified classification)
    if (data.airQuality.pm10) {
      const pm10Aqi = this.estimateAqiFromLevel(data.airQuality.pm10.level);
      if (pm10Aqi > maxAqi) {
        maxAqi = pm10Aqi;
        dominantPollutant = 'PM10';
        category = this.getAqiCategory(pm10Aqi);
      }
    }

    return {
      aqi: maxAqi,
      dominantPollutant,
      category: category || this.getAqiCategory(maxAqi)
    };
  }

  /**
   * Estimate AQI value from level classification
   */
  estimateAqiFromLevel(level) {
    const levelToAqi = {
      'good': 25,
      'moderate': 75,
      'unhealthy_sensitive': 125,
      'unhealthy': 175,
      'very_unhealthy': 250,
      'hazardous': 350
    };
    
    return levelToAqi[level] || 0;
  }

  /**
   * Calculate comfort metrics
   */
  calculateComfort(temperature, humidity) {
    // Heat index calculation (simplified)
    let heatIndex = temperature;
    if (temperature >= 27 && humidity >= 40) {
      heatIndex = -8.78469475556 +
                  1.61139411 * temperature +
                  2.33854883889 * humidity +
                  -0.14611605 * temperature * humidity +
                  -0.012308094 * Math.pow(temperature, 2) +
                  -0.0164248277778 * Math.pow(humidity, 2) +
                  0.002211732 * Math.pow(temperature, 2) * humidity +
                  0.00072546 * temperature * Math.pow(humidity, 2) +
                  -0.000003582 * Math.pow(temperature, 2) * Math.pow(humidity, 2);
    }

    // Comfort classification
    let comfort = 'comfortable';
    let description = 'Comfortable conditions';
    
    if (temperature < 16 || temperature > 30) {
      comfort = 'uncomfortable';
      description = temperature < 16 ? 'Too cold' : 'Too hot';
    } else if (humidity < 30 || humidity > 70) {
      comfort = 'moderate';
      description = humidity < 30 ? 'Too dry' : 'Too humid';
    } else if (heatIndex > 32) {
      comfort = 'uncomfortable';
      description = 'High heat index';
    }

    return {
      temperature: {
        value: temperature,
        comfort: this.classifyTemperature(temperature)
      },
      humidity: {
        value: humidity,
        comfort: this.classifyHumidity(humidity)
      },
      heatIndex: Math.round(heatIndex * 10) / 10,
      overall: {
        level: comfort,
        description
      }
    };
  }

  /**
   * Classify temperature comfort
   */
  classifyTemperature(temp) {
    if (temp < 10) return 'very_cold';
    if (temp < 16) return 'cold';
    if (temp < 20) return 'cool';
    if (temp <= 26) return 'comfortable';
    if (temp <= 30) return 'warm';
    if (temp <= 35) return 'hot';
    return 'very_hot';
  }

  /**
   * Classify humidity comfort
   */
  classifyHumidity(humidity) {
    if (humidity < 30) return 'very_dry';
    if (humidity < 40) return 'dry';
    if (humidity <= 60) return 'comfortable';
    if (humidity <= 70) return 'humid';
    return 'very_humid';
  }

  /**
   * Aggregate data by time period
   */
  aggregateData(feeds, period = '1h') {
    if (!feeds || feeds.length === 0) {
      return [];
    }

    const periodMs = this.parsePeriodToMs(period);
    const groups = this.groupByPeriod(feeds, periodMs);
    
    return Object.entries(groups).map(([timestamp, groupFeeds]) => {
      return this.calculateAggregateStats(groupFeeds, new Date(parseInt(timestamp)));
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Parse period string to milliseconds
   */
  parsePeriodToMs(period) {
    const match = period.match(/^(\d+)([mhd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  /**
   * Group feeds by time period
   */
  groupByPeriod(feeds, periodMs) {
    const groups = {};
    
    feeds.forEach(feed => {
      const timestamp = moment(feed.created_at).valueOf();
      const periodStart = Math.floor(timestamp / periodMs) * periodMs;
      
      if (!groups[periodStart]) {
        groups[periodStart] = [];
      }
      groups[periodStart].push(feed);
    });
    
    return groups;
  }

  /**
   * Calculate aggregate statistics for a group
   */
  calculateAggregateStats(feeds, timestamp) {
    const fields = ['temperature', 'humidity', 'pm25', 'pm10'];
    const stats = {
      timestamp: timestamp.toISOString(),
      count: feeds.length
    };

    fields.forEach(field => {
      const values = feeds
        .map(feed => feed[field])
        .filter(val => val !== null && val !== undefined && !isNaN(val));

      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        stats[field] = {
          avg: this.round(values.reduce((sum, val) => sum + val, 0) / values.length, 2),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          median: this.calculateMedian(sorted),
          count: values.length
        };
      } else {
        stats[field] = null;
      }
    });

    // Add air quality for averages
    if (stats.pm25 && stats.pm25.avg !== null) {
      stats.airQuality = {
        pm25: this.classifyPM25(stats.pm25.avg),
        epaAqi: this.calculateEpaAqi(stats.pm25.avg)
      };
    }

    return stats;
  }

  /**
   * Calculate median value
   */
  calculateMedian(sortedValues) {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  /**
   * Round number to specified decimal places
   */
  round(num, decimals) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'DataProcessing',
      validationEnabled: this.config.validationEnabled,
      outlierDetection: this.config.outlierDetection,
      aggregationPeriods: this.config.aggregationPeriods
    };
  }
}

module.exports = new DataProcessingService();