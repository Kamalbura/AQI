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

interface MultiChartProps {
  data: AirQualityData[];
  title: string;
}

export const MultiChart = ({ data, title }: MultiChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="widget-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📈</div>
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for Chart.js
  const recentData = data.slice(-24); // Last 24 readings

  const chartData = {
    labels: recentData.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: 'AQI',
        data: recentData.map(item => item.aqi),
        borderColor: '#1677ff',
        backgroundColor: '#1677ff20',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'PM2.5 (μg/m³)',
        data: recentData.map(item => item.pm25),
        borderColor: '#ff4d4f',
        backgroundColor: '#ff4d4f20',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      },
      {
        label: 'PM10 (μg/m³)',
        data: recentData.map(item => item.pm10),
        borderColor: '#fa8c16',
        backgroundColor: '#fa8c1620',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      },
      {
        label: 'Temperature (°C)',
        data: recentData.map(item => item.temperature),
        borderColor: '#52c41a',
        backgroundColor: '#52c41a20',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y2',
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'AQI',
          color: '#1677ff',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#1677ff',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Pollutants (μg/m³)',
          color: '#ff4d4f',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#ff4d4f',
        },
      },
      y2: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderWidth: 1,
        cornerRadius: 8,
        mode: 'index' as const,
        intersect: false,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        hoverRadius: 8,
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
          <div className="text-sm text-gray-500">
            Last 24 readings
          </div>
        </div>
      </div>
      
      {/* Chart.js Multi-Line Chart */}
      <div className="h-80 relative">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="font-semibold text-blue-600">
            {recentData[recentData.length - 1]?.aqi || 'N/A'}
          </div>
          <div className="text-blue-500">Current AQI</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="font-semibold text-red-600">
            {recentData[recentData.length - 1]?.pm25 || 'N/A'}
          </div>
          <div className="text-red-500">PM2.5 μg/m³</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="font-semibold text-orange-600">
            {recentData[recentData.length - 1]?.pm10 || 'N/A'}
          </div>
          <div className="text-orange-500">PM10 μg/m³</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="font-semibold text-green-600">
            {recentData[recentData.length - 1]?.temperature || 'N/A'}°C
          </div>
          <div className="text-green-500">Temperature</div>
        </div>
      </div>
    </div>
  );
};