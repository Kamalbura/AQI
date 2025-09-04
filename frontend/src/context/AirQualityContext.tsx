import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateMockCurrentData, generateMockHistoricalData } from '../services/mockDataService';

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

  const fetchJson = useCallback(async (url: string) => {
    let response: Response | null = null;
    try {
      response = await fetch(url);
    } catch (networkErr) {
      throw new Error('Network error contacting server');
    }
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // ignore JSON parse failure; will fall back to status text
    }
    if (!response.ok) {
      if (payload && (payload.error || payload.message)) {
        throw new Error(payload.error || payload.message);
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return payload;
  }, []);

  const fetchCurrentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch real data from API
      const data = await fetchJson('/api/data/latest');
      if (data?.success && data.data) {
        setCurrentData(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data?.error || data?.message || 'Failed to fetch current data');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching current data:', err);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data for development...');
      const mockData = generateMockCurrentData();
      setCurrentData(mockData);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson]);

  const fetchHistoricalData = useCallback(async (days: number = 7) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch real data from API
      const data = await fetchJson(`/api/data/historical?days=${days}`);
      if (data?.success && data.data) {
        setHistoricalData(data.data);
      } else {
        throw new Error(data?.error || data?.message || 'Failed to fetch historical data');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching historical data:', err);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock historical data for development...');
      const mockData = generateMockHistoricalData(days);
      setHistoricalData(mockData);
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson]);

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