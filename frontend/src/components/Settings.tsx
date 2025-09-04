import React from 'react';

export const Settings = () => {
  return (
    <div className="space-y-8">
      <div className="text-center widget-card">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          ⚙️ Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Configure your air quality monitoring preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <div className="widget-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  AQI Alerts
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when air quality changes
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Health Recommendations
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receive health and activity suggestions
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="widget-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Display
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Temperature Unit
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all hover:shadow-md">
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Theme
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all hover:shadow-md">
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="widget-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Location
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Monitoring Location
              </label>
              <input
                type="text"
                placeholder="Enter location name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-all hover:shadow-md"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Auto-detect Location
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Use your device's location for accurate readings
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Data Settings */}
        <div className="widget-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data & Updates
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Update Frequency
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all hover:shadow-md">
                <option value="1">Every minute</option>
                <option value="5" selected>Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Data Retention
              </label>
              <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all hover:shadow-md">
                <option value="7">7 days</option>
                <option value="30" selected>30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button className="btn-primary">
          Save Settings
        </button>
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-all hover:shadow-lg hover:-translate-y-1">
          Reset to Defaults
        </button>
      </div>

      {/* System Info */}
      <div className="widget-card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Version:</span>
            <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
            <span className="font-medium text-gray-900 dark:text-white">Just now</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
            <span className="font-medium text-gray-900 dark:text-white">ThingSpeak API</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className="font-medium text-green-600">🟢 Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};