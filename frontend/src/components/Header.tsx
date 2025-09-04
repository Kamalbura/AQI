import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAirQuality } from '../context/AirQualityContext';

export const Header = () => {
  const location = useLocation();
  const { lastUpdated, isLoading, refreshData, currentData } = useAirQuality();
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
      minute: '2-digit'
    }).format(lastUpdated);
  };

  const getAQIStatus = () => {
    if (!currentData?.aqi) return { text: 'No Data', color: 'text-gray-500', value: '--' };
    const aqi = Math.round(currentData.aqi); // Round to nearest integer
    if (aqi <= 50) return { text: 'Good', color: 'text-green-600', value: aqi.toString() };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-600', value: aqi.toString() };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', color: 'text-orange-600', value: aqi.toString() };
    if (aqi <= 200) return { text: 'Unhealthy', color: 'text-red-600', value: aqi.toString() };
    if (aqi <= 300) return { text: 'Very Unhealthy', color: 'text-purple-600', value: aqi.toString() };
    return { text: 'Hazardous', color: 'text-red-800', value: aqi.toString() };
  };

  const aqiStatus = getAQIStatus();

  return (
    <header className="bg-white/98 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm" style={{ height: 'var(--header-height)' }}>
      <div className="container mx-auto px-4" style={{ maxWidth: 'var(--container-max-width)' }}>
        <div className="flex justify-between items-center" style={{ height: 'var(--header-height)' }}>
          {/* Left: Logo and Status */}
          <div className="flex items-center" style={{ gap: 'var(--space-md)' }}>
            <Link 
              to="/" 
              className="flex items-center hover:opacity-80 transition-opacity"
              style={{ 
                gap: 'var(--space-xs)', 
                textDecoration: 'none' 
              }}
            >
              <div style={{ fontSize: 'var(--text-xl)' }}>🌬️</div>
              <div className="hidden sm:block">
                <div 
                  className="font-semibold" 
                  style={{ 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-primary)',
                    fontWeight: 'var(--font-weight-bold)'
                  }}
                >
                  Air Quality
                </div>
                <div 
                  className={`font-medium ${aqiStatus.color}`}
                  style={{ 
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  {currentData?.aqi ? `${aqiStatus.value} • ${aqiStatus.text}` : 'Loading...'}
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center rounded-full" style={{ 
            backgroundColor: 'var(--gray-100)', 
            padding: 'var(--space-xxs)' 
          }}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center rounded-full text-sm font-medium transition-all duration-200 ${
                  isActivePath(item.href) ? 'shadow-sm' : ''
                }`}
                style={{
                  gap: 'var(--space-xs)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  backgroundColor: isActivePath(item.href) ? 'var(--surface)' : 'transparent',
                  color: isActivePath(item.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActivePath(item.href)) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActivePath(item.href)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{ fontSize: 'var(--text-sm)' }}>{item.icon}</span>
                <span className="hidden lg:block">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right: Action Buttons */}
          <div className="flex items-center" style={{ gap: 'var(--space-md)' }}>
            {/* Last Updated */}
            <div className="hidden sm:block text-xs px-3 py-1.5 rounded-full" style={{ 
              color: 'var(--text-secondary)', 
              backgroundColor: 'var(--gray-100)',
              fontSize: 'var(--text-xs)'
            }}>
              {formatLastUpdated()}
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`rounded-full transition-all duration-200 ${
                isLoading
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:shadow-lg hover:scale-105'
              }`}
              style={{ 
                padding: 'var(--space-sm)',
                backgroundColor: isLoading ? 'var(--gray-100)' : 'var(--gray-100)',
                color: isLoading ? 'var(--text-disabled)' : 'var(--text-secondary)',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-500)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              title="Refresh data"
            >
              <div className={`${isLoading ? 'animate-spin' : ''}`} style={{ fontSize: 'var(--text-sm)' }}>
                🔄
              </div>
            </button>

            {/* Export Button */}
            <button
              className="hidden sm:flex items-center rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
              style={{ 
                gap: 'var(--space-xs)',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--gray-100)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary-500)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Export data"
            >
              <span style={{ fontSize: 'var(--text-sm)' }}>📊</span>
              <span className="hidden lg:block">Export</span>
            </button>

            {/* Alerts Button */}
            <button
              className="hidden sm:flex items-center rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 relative"
              style={{ 
                gap: 'var(--space-xs)',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--gray-100)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--warning)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Alerts & notifications"
            >
              <span style={{ fontSize: 'var(--text-sm)' }}>🔔</span>
              <span className="hidden lg:block">Alerts</span>
              {currentData?.aqi && currentData.aqi > 100 && (
                <div 
                  className="absolute -top-1 -right-1 rounded-full animate-pulse"
                  style={{ 
                    width: 'var(--space-sm)', 
                    height: 'var(--space-sm)', 
                    backgroundColor: 'var(--error)' 
                  }}
                ></div>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-full transition-all duration-200"
              style={{ 
                padding: 'var(--space-sm)',
                backgroundColor: 'var(--gray-100)',
                color: 'var(--text-secondary)',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-200)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)';
              }}
            >
              <div style={{ fontSize: 'var(--text-sm)' }}>
                {isMobileMenuOpen ? '✕' : '☰'}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Action Buttons */}
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                <button className="flex items-center space-x-3 px-4 py-2 w-full text-left rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  <span className="text-lg">📊</span>
                  <span>Export Data</span>
                </button>
                <button className="flex items-center space-x-3 px-4 py-2 w-full text-left rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  <span className="text-lg">🔔</span>
                  <span>Alerts & Notifications</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};