// src/contexts/AnalyticsContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import analyticsService from '../services/analytics';

// The context will hold the analytics service instance
const AnalyticsContext = createContext(analyticsService);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

// The provider component initializes Mixpanel and makes the service available
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize Mixpanel when the app loads
    analyticsService.init();
  }, []);

  return (
    <AnalyticsContext.Provider value={analyticsService}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook for easy access to the analytics service
export const useAnalytics = () => {
  return useContext(AnalyticsContext);
};