import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAirQuality } from '../context/AirQualityContext';

export const Header = () => {
  const location = useLocation();
  const { lastUpdated, isLoading, refreshData } = useAirQuality();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Historical', href: '/historical', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(lastUpdated);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🌬️</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Air Quality Monitor
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {formatLastUpdated()}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActivePath(item.href)
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Refresh Button and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                isLoading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Refresh data"
            >
              <div className={`text-lg ${isLoading ? 'animate-spin' : ''}`}>
                🔄
              </div>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="text-lg">☰</div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActivePath(item.href)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};