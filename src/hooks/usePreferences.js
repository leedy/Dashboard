import { useState, useEffect } from 'react';

const DEFAULT_PREFERENCES = {
  favoriteNHLTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Flyers'
  },
  favoriteNFLTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Eagles'
  },
  weatherLocation: {
    zipcode: '17042',
    city: 'Lebanon, PA',
    latitude: 40.34093,
    longitude: -76.41135
  },
  countdownEvent: {
    name: 'New Year',
    date: '2026-01-01'
  },
  defaultDashboard: 'sports',
  displaySettings: {
    autoRotate: false,
    refreshInterval: 60000
  }
};

const STORAGE_KEY = 'dashboard_preferences';

/**
 * Custom hook for managing user preferences
 * Uses localStorage for persistence, designed to be easily migrated to API backend later
 */
export const usePreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    // Load preferences from localStorage on initial mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [preferences]);

  // Update individual preference sections
  const updatePreferences = (updates) => {
    setPreferences(prev => ({
      ...prev,
      ...updates
    }));
  };

  const updateFavoriteNHLTeam = (team) => {
    setPreferences(prev => ({
      ...prev,
      favoriteNHLTeam: team
    }));
  };

  const updateFavoriteNFLTeam = (team) => {
    setPreferences(prev => ({
      ...prev,
      favoriteNFLTeam: team
    }));
  };

  const updateWeatherLocation = (location) => {
    setPreferences(prev => ({
      ...prev,
      weatherLocation: location
    }));
  };

  const updateDefaultDashboard = (dashboard) => {
    setPreferences(prev => ({
      ...prev,
      defaultDashboard: dashboard
    }));
  };

  const updateDisplaySettings = (settings) => {
    setPreferences(prev => ({
      ...prev,
      displaySettings: {
        ...prev.displaySettings,
        ...settings
      }
    }));
  };

  const updateCountdownEvent = (event) => {
    setPreferences(prev => ({
      ...prev,
      countdownEvent: event
    }));
  };

  // Reset to defaults
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreferences,
    updateFavoriteNHLTeam,
    updateFavoriteNFLTeam,
    updateWeatherLocation,
    updateDefaultDashboard,
    updateDisplaySettings,
    updateCountdownEvent,
    resetPreferences
  };
};

export default usePreferences;
