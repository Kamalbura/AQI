import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { Historical } from './components/Historical';
import { AirQualityProvider } from './context/AirQualityContext';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';

interface AppState {
  isLoading: boolean;
  error: string | null;
}

const App = () => {
  const [appState, setAppState] = useState<AppState>({
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Check if backend API is available
    const checkApiHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error('API health check failed');
        }
        setAppState({ isLoading: false, error: null });
      } catch (error: any) {
        console.error('API health check failed:', error);
        setAppState({ 
          isLoading: false, 
          error: 'Unable to connect to backend API. Please check your connection.' 
        });
      }
    };

    checkApiHealth();
  }, []);

  if (appState.isLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <LoadingSpinner message="Initializing Air Quality Monitor..." />
      </div>
    );
  }

  if (appState.error) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center p-8 widget-card max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{appState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AirQualityProvider>
        <Router>
          <div className="min-h-screen hero-gradient">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/historical" element={<Historical />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AirQualityProvider>
    </ErrorBoundary>
  );
};

export default App;