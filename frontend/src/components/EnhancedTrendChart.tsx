import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { AirQualityData } from '../context/AirQualityContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: title,
        data: data.map(item => Number(item[dataKey])),
        borderColor: color,
        backgroundColor: color + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: color,
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toFixed(1)} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return `${value} ${unit}`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
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
            {Number(currentValue).toFixed(1)} {unit}
          </div>
          {trend !== 0 && (
            <div className={`text-sm flex items-center ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}
            </div>
          )}
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Last {data.length} readings</span>
        <span>{data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleDateString() : ''}</span>
      </div>
    </div>
  );
};