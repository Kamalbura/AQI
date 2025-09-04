import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { AirQualityData } from '../context/AirQualityContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

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
  const chartRef = useRef(null);

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

  // Prepare data for Chart.js
  const recentData = data.slice(-24); // Last 24 readings
  const currentValue = data[data.length - 1]?.[dataKey];
  const previousValue = data[data.length - 2]?.[dataKey];
  const trend = currentValue && previousValue ? 
    Number(currentValue) - Number(previousValue) : 0;

  const chartData = {
    labels: recentData.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: `${title} (${unit})`,
        data: recentData.map(item => Number(item[dataKey])),
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'HH:mm',
            minute: 'HH:mm'
          },
          tooltipFormat: 'MMM dd, HH:mm'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#666',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#666',
          callback: function(value: any) {
            return `${value} ${unit}`;
          }
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} ${unit}`;
          }
        }
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: color,
      },
    },
  };

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
            <div className={`text-sm flex items-center ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              <span className="mr-1">{trend > 0 ? '↗' : '↘'}</span>
              <span>{Math.abs(trend).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart.js Line Chart */}
      <div className="h-64 relative">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Last 24 readings</span>
        <span>{data.length} data points</span>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <span>
          Range: {Math.min(...recentData.map(item => Number(item[dataKey]))).toFixed(1)} - {Math.max(...recentData.map(item => Number(item[dataKey]))).toFixed(1)} {unit}
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
          {title}
        </span>
      </div>
    </div>
  );
};