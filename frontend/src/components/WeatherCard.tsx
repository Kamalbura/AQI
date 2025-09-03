import React from 'react';
import { AirQualityData } from '../context/AirQualityContext';

interface WeatherCardProps {
  data: AirQualityData | null;
}

export const WeatherCard = ({ data }: WeatherCardProps) => {
  if (!data) {
    return (
      <div className="widget-card">
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🌡️</div>
          <p className="text-gray-500 dark:text-gray-400">No weather data available</p>
        </div>
      </div>
    );
  }

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 10) return 'text-blue-500';
    if (temp < 20) return 'text-green-500';
    if (temp < 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity < 30) return 'text-yellow-600';
    if (humidity < 60) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <div className="widget-card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Weather Conditions
      </h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Temperature */}
        <div className="text-center">
          <div className="text-4xl mb-2">🌡️</div>
          <div className={`text-3xl font-bold ${getTemperatureColor(data.temperature)}`}>
            {data.temperature}°C
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Temperature</div>
        </div>

        {/* Humidity */}
        <div className="text-center">
          <div className="text-4xl mb-2">💧</div>
          <div className={`text-3xl font-bold ${getHumidityColor(data.humidity)}`}>
            {data.humidity}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Humidity</div>
        </div>
      </div>

      {/* Additional Weather Info */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Feels like:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {(data.temperature + 2).toFixed(1)}°C
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Comfort:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {data.humidity > 60 ? 'Humid' : data.humidity < 30 ? 'Dry' : 'Comfortable'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};