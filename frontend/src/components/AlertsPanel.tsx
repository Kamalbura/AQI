import React from 'react';
import { AirQualityData } from '../context/AirQualityContext';

interface AlertsPanelProps {
  data: AirQualityData | null;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  icon: string;
}

export const AlertsPanel = ({ data }: AlertsPanelProps) => {
  const generateAlerts = (data: AirQualityData | null): Alert[] => {
    if (!data) return [];

    const alerts: Alert[] = [];

    // AQI-based alerts
    if (data.aqi > 150) {
      alerts.push({
        id: 'aqi-unhealthy',
        type: 'danger',
        title: 'Unhealthy Air Quality',
        message: 'Consider limiting outdoor activities and wearing a mask when outside.',
        icon: '🚨'
      });
    } else if (data.aqi > 100) {
      alerts.push({
        id: 'aqi-sensitive',
        type: 'warning',
        title: 'Unhealthy for Sensitive Groups',
        message: 'People with respiratory conditions should limit outdoor exposure.',
        icon: '⚠️'
      });
    }

    // PM2.5 specific alerts
    if (data.pm25 > 35) {
      alerts.push({
        id: 'pm25-high',
        type: data.pm25 > 55 ? 'danger' : 'warning',
        title: 'High PM2.5 Levels',
        message: `PM2.5 concentration is ${data.pm25} μg/m³. Consider using air purifiers indoors.`,
        icon: '🌫️'
      });
    }

    // Temperature alerts
    if (data.temperature > 35) {
      alerts.push({
        id: 'temp-high',
        type: 'warning',
        title: 'High Temperature',
        message: 'Stay hydrated and avoid prolonged outdoor exposure during peak hours.',
        icon: '🌡️'
      });
    } else if (data.temperature < 0) {
      alerts.push({
        id: 'temp-low',
        type: 'warning',
        title: 'Freezing Temperature',
        message: 'Dress warmly and be cautious of icy conditions.',
        icon: '❄️'
      });
    }

    // Humidity alerts
    if (data.humidity > 80) {
      alerts.push({
        id: 'humidity-high',
        type: 'info',
        title: 'High Humidity',
        message: 'High humidity levels may cause discomfort. Consider using a dehumidifier.',
        icon: '💧'
      });
    } else if (data.humidity < 30) {
      alerts.push({
        id: 'humidity-low',
        type: 'info',
        title: 'Low Humidity',
        message: 'Low humidity may cause dry skin and respiratory irritation.',
        icon: '🏜️'
      });
    }

    // If no alerts, add a positive message
    if (alerts.length === 0) {
      alerts.push({
        id: 'all-good',
        type: 'info',
        title: 'Good Air Quality',
        message: 'Air quality conditions are favorable for outdoor activities.',
        icon: '✅'
      });
    }

    return alerts;
  };

  const alerts = generateAlerts(data);

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    }
  };

  return (
    <div className="widget-card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Health Alerts & Recommendations
      </h2>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertStyles(alert.type)}`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-xl flex-shrink-0">{alert.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-1">{alert.title}</h3>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Recommendations updated based on current conditions
        </p>
      </div>
    </div>
  );
};