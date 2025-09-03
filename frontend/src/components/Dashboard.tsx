import React from 'react';
import { useAirQuality } from '../context/AirQualityContext';
import { LoadingSpinner } from './LoadingSpinner';
import { AQICard } from './AQICard';
import { WeatherCard } from './WeatherCard';
import { TrendChart } from './TrendChart';
import { AlertsPanel } from './AlertsPanel';

export const Dashboard = () => {
  const { currentData, historicalData, isLoading, error } = useAirQuality();

  if (isLoading && !currentData) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner message="Loading air quality data..." />
      </div>
    );
  }

  if (error && !currentData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Data Unavailable
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Real-time Air Quality
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor air quality conditions in your area
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main AQI Card */}
        <div className="lg:col-span-1">
          <AQICard data={currentData} />
        </div>

        {/* Right Column - Weather and Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <WeatherCard data={currentData} />
          <AlertsPanel data={currentData} />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TrendChart
          data={historicalData}
          title="PM2.5 Trend"
          dataKey="pm25"
          color="#ef4444"
          unit="μg/m³"
        />
        <TrendChart
          data={historicalData}
          title="AQI Trend"
          dataKey="aqi"
          color="#3b82f6"
          unit="AQI"
        />
      </div>

      {/* Additional Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          About Air Quality Index (AQI)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="aqi-good border rounded-lg p-3">
            <div className="font-semibold">Good (0-50)</div>
            <div>Air quality is satisfactory</div>
          </div>
          <div className="aqi-moderate border rounded-lg p-3">
            <div className="font-semibold">Moderate (51-100)</div>
            <div>Acceptable for most people</div>
          </div>
          <div className="aqi-unhealthy-sensitive border rounded-lg p-3">
            <div className="font-semibold">Unhealthy for Sensitive Groups (101-150)</div>
            <div>May cause problems for sensitive individuals</div>
          </div>
          <div className="aqi-unhealthy border rounded-lg p-3">
            <div className="font-semibold">Unhealthy (151-200)</div>
            <div>May cause health problems for everyone</div>
          </div>
          <div className="aqi-very-unhealthy border rounded-lg p-3">
            <div className="font-semibold">Very Unhealthy (201-300)</div>
            <div>Health alert for everyone</div>
          </div>
          <div className="aqi-hazardous border rounded-lg p-3">
            <div className="font-semibold">Hazardous (301+)</div>
            <div>Emergency conditions</div>
          </div>
        </div>
      </div>
    </div>
  );
};