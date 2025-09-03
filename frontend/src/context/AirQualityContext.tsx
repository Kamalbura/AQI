import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AirQualityData {
  timestamp: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  aqi: number;
  aqiCategory: string;
  location?: string;
}

export interface AirQualityContextType {
  currentData: AirQualityData | null;
  historicalData: AirQualityData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
  fetchHistoricalData: (days?: number) => Promise<void>;
}

const AirQualityContext = createContext<AirQualityContextType | undefined>(undefined);

interface AirQualityProviderProps {
  children: React.ReactNode;
}

export const AirQualityProvider = ({ children }: AirQualityProviderProps) => {
  const [currentData, setCurrentData] = useState<AirQualityData | null>(null);
  const [historicalData, setHistoricalData] = useState<AirQualityData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCurrentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/data/latest');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setCurrentData(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.message || 'Failed to fetch current data');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching current data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistoricalData = useCallback(async (days: number = 7) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/data/historical?days=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setHistoricalData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch historical data');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching historical data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchCurrentData(),
      fetchHistoricalData()
    ]);
  }, [fetchCurrentData, fetchHistoricalData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    fetchCurrentData();
    const interval = setInterval(fetchCurrentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCurrentData]);

  const contextValue: AirQualityContextType = {
    currentData,
    historicalData,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    fetchHistoricalData
  };

  return (
    <AirQualityContext.Provider value={contextValue}>
      {children}
    </AirQualityContext.Provider>
  );
};

export const useAirQuality = (): AirQualityContextType => {
  const context = useContext(AirQualityContext);
  if (context === undefined) {
    throw new Error('useAirQuality must be used within an AirQualityProvider');
  }
  return context;
};