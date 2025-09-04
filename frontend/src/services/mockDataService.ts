// Temporary mock data service to showcase UI while ThingSpeak API is being fixed
import { AirQualityData } from '../context/AirQualityContext';

export const generateMockCurrentData = (): AirQualityData => {
  const baseTime = new Date();
  
  return {
    timestamp: baseTime.toISOString(),
    pm25: 15.3 + Math.random() * 10, // Simulate varying PM2.5 levels
    pm10: 22.8 + Math.random() * 15, // Simulate varying PM10 levels  
    temperature: 22 + Math.random() * 8, // 22-30°C range
    humidity: 45 + Math.random() * 20, // 45-65% range
    aqi: 42 + Math.random() * 50, // AQI between 42-92 (Good to Moderate)
    aqiCategory: 'Good',
    location: 'Istanbul, Turkey'
  };
};

export const generateMockHistoricalData = (days: number = 7): AirQualityData[] => {
  const data: AirQualityData[] = [];
  const now = new Date();
  
  // Generate hourly data for the specified number of days
  for (let i = days * 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    
    // Create realistic patterns with some randomness
    const hourOfDay = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Simulate traffic patterns (higher pollution during rush hours)
    let aqiBase = 35;
    if (hourOfDay >= 7 && hourOfDay <= 9) aqiBase += 15; // Morning rush
    if (hourOfDay >= 17 && hourOfDay <= 19) aqiBase += 20; // Evening rush
    if (dayOfWeek === 0 || dayOfWeek === 6) aqiBase -= 10; // Weekend lower
    
    const aqi = Math.max(10, aqiBase + (Math.random() - 0.5) * 30);
    const pm25 = (aqi * 0.3) + Math.random() * 5;
    const pm10 = pm25 * 1.5 + Math.random() * 8;
    
    // Temperature variation (cooler at night)
    const tempBase = 24;
    const tempVariation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 6;
    const temperature = tempBase + tempVariation + (Math.random() - 0.5) * 3;
    
    // Humidity (higher at night)
    const humidity = 50 + Math.sin((hourOfDay - 12) * Math.PI / 12) * 15 + (Math.random() - 0.5) * 10;
    
    data.push({
      timestamp: timestamp.toISOString(),
      pm25: Math.max(0, pm25),
      pm10: Math.max(0, pm10),
      temperature: Math.max(-10, Math.min(45, temperature)),
      humidity: Math.max(10, Math.min(90, humidity)),
      aqi: Math.round(aqi),
      aqiCategory: getAQICategory(aqi),
      location: 'Istanbul, Turkey'
    });
  }
  
  return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

// Export for easy access
export const mockDataService = {
  generateMockCurrentData,
  generateMockHistoricalData
};