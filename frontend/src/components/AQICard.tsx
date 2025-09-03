import React from 'react';
import { AirQualityData } from '../context/AirQualityContext';

interface AQICardProps {
  data: AirQualityData | null;
}

export const AQICard = ({ data }: AQICardProps) => {
  if (!data) {
    return (
      <div className="widget-card">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500 dark:text-gray-400">No AQI data available</p>
        </div>
      </div>
    );
  }

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-600 bg-green-50 border-green-200';
    if (aqi <= 100) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (aqi <= 150) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (aqi <= 200) return 'text-red-600 bg-red-50 border-red-200';
    if (aqi <= 300) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-gray-100 bg-gray-800 border-gray-700';
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { status: 'Good', emoji: '😊' };
    if (aqi <= 100) return { status: 'Moderate', emoji: '😐' };
    if (aqi <= 150) return { status: 'Unhealthy for Sensitive Groups', emoji: '😷' };
    if (aqi <= 200) return { status: 'Unhealthy', emoji: '😨' };
    if (aqi <= 300) return { status: 'Very Unhealthy', emoji: '🚨' };
    return { status: 'Hazardous', emoji: '☠️' };
  };

  const aqiInfo = getAQIStatus(data.aqi);
  const colorClasses = getAQIColor(data.aqi);

  return (
    <div className="widget-card">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Air Quality Index
        </h2>
        
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${colorClasses} mb-4`}>
          <div className="text-center">
            <div className="text-3xl font-bold">{data.aqi}</div>
            <div className="text-sm font-medium">AQI</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">{aqiInfo.emoji}</span>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              {aqiInfo.status}
            </span>
          </div>
          
          {data.location && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📍 {data.location}
            </p>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Updated: {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>

        {/* Pollutant Details */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Pollutant Levels
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-white">
                {data.pm25}
              </div>
              <div className="text-gray-600 dark:text-gray-400">PM2.5 μg/m³</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="font-semibold text-gray-900 dark:text-white">
                {data.pm10}
              </div>
              <div className="text-gray-600 dark:text-gray-400">PM10 μg/m³</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};