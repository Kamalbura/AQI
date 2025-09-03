import React, { useState, useEffect } from 'react';
import { useAirQuality } from '../context/AirQualityContext';
import { LoadingSpinner } from './LoadingSpinner';

export const Historical = () => {
  const { historicalData, fetchHistoricalData, isLoading, error } = useAirQuality();
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [selectedMetric, setSelectedMetric] = useState('aqi');

  useEffect(() => {
    fetchHistoricalData(selectedPeriod);
  }, [selectedPeriod, fetchHistoricalData]);

  const periods = [
    { value: 1, label: '24 Hours' },
    { value: 7, label: '7 Days' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' }
  ];

  const metrics = [
    { value: 'aqi', label: 'Air Quality Index', unit: 'AQI' },
    { value: 'pm25', label: 'PM2.5', unit: 'μg/m³' },
    { value: 'pm10', label: 'PM10', unit: 'μg/m³' },
    { value: 'temperature', label: 'Temperature', unit: '°C' },
    { value: 'humidity', label: 'Humidity', unit: '%' }
  ];

  const getMetricStats = (data: any[], metric: string) => {
    if (!data || data.length === 0) return null;

    const values = data.map(item => Number(item[metric])).filter(val => !isNaN(val));
    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return { min, max, avg };
  };

  const stats = getMetricStats(historicalData, selectedMetric);
  const currentMetric = metrics.find(m => m.value === selectedMetric);

  if (isLoading && historicalData.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner message="Loading historical data..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Historical Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze air quality trends over time
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {metrics.map(metric => (
              <option key={metric.value} value={metric.value}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && currentMetric && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="widget-card text-center">
            <div className="text-3xl mb-2">📉</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.min.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Minimum {currentMetric.label} ({currentMetric.unit})
            </div>
          </div>

          <div className="widget-card text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.avg.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average {currentMetric.label} ({currentMetric.unit})
            </div>
          </div>

          <div className="widget-card text-center">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.max.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Maximum {currentMetric.label} ({currentMetric.unit})
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="widget-card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Readings
        </h2>
        
        {error && (
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
            >
              Retry
            </button>
          </div>
        )}

        {historicalData.length === 0 && !error ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-500 dark:text-gray-400">No historical data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Timestamp
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                    AQI
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                    PM2.5
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                    PM10
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Temperature
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Humidity
                  </th>
                </tr>
              </thead>
              <tbody>
                {historicalData.slice(0, 50).map((reading, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {new Date(reading.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        reading.aqi <= 50 ? 'bg-green-100 text-green-800' :
                        reading.aqi <= 100 ? 'bg-yellow-100 text-yellow-800' :
                        reading.aqi <= 150 ? 'bg-orange-100 text-orange-800' :
                        reading.aqi <= 200 ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {reading.aqi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900 dark:text-white">
                      {reading.pm25} μg/m³
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900 dark:text-white">
                      {reading.pm10} μg/m³
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900 dark:text-white">
                      {reading.temperature}°C
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900 dark:text-white">
                      {reading.humidity}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {historicalData.length > 50 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing latest 50 readings of {historicalData.length} total
            </p>
          </div>
        )}
      </div>
    </div>
  );
};