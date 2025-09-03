import React from 'react';
import { AirQualityData } from '../context/AirQualityContext';

interface TrendChartProps {
  data: AirQualityData[];
  title: string;
  dataKey: keyof AirQualityData;
  color: string;
  unit: string;
}

export const TrendChart = ({
  data,
  title,
  dataKey,
  color,
  unit
}: TrendChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="widget-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📈</div>
            <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
          </div>
        </div>
      </div>
    );
  }

  const currentValue = data[data.length - 1]?.[dataKey];
  const previousValue = data[data.length - 2]?.[dataKey];
  const trend = currentValue && previousValue ? 
    Number(currentValue) - Number(previousValue) : 0;

  // Simple data points for visual representation
  const recentData = data.slice(-24); // Last 24 readings
  const maxValue = Math.max(...recentData.map(item => Number(item[dataKey])));
  const minValue = Math.min(...recentData.map(item => Number(item[dataKey])));

  return (
    <div className="widget-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color }}>
            {currentValue} {unit}
          </div>
          {trend !== 0 && (
            <div className={`text-sm ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}
            </div>
          )}
        </div>
      </div>
      
      {/* Simple trend visualization */}
      <div className="h-64 flex items-end justify-between space-x-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        {recentData.map((item, index) => {
          const value = Number(item[dataKey]);
          const height = ((value - minValue) / (maxValue - minValue)) * 200 || 10;
          return (
            <div
              key={index}
              className="flex-1 min-w-0 rounded-t"
              style={{
                height: `${height}px`,
                backgroundColor: color,
                opacity: 0.7 + (index / recentData.length) * 0.3
              }}
              title={`${new Date(item.timestamp).toLocaleTimeString()}: ${value} ${unit}`}
            />
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Last 24 readings</span>
        <span>{data.length} data points</span>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>Min: {minValue.toFixed(1)} {unit}</span>
        <span>Max: {maxValue.toFixed(1)} {unit}</span>
      </div>
    </div>
  );
};