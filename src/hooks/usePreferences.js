import { useState, useEffect } from 'react';
import axios from 'axios';

const DEFAULT_PREFERENCES = {
  favoriteNHLTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Flyers'
  },
  favoriteNFLTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Eagles'
  },
  favoriteMLBTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Phillies'
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
  defaultDashboard: 'todays-games',
  displaySettings: {
    autoRotate: false,
    rotateInterval: 30,
    refreshInterval: 60000,
    rotationDashboards: [
      'todays-games',
      'upcoming-games',
      'standings',
      'weather',
      'countdown',
      'disney',
      'movies',
      'family-photos',
      'event-slides'
    ]
  },
  disneyExcludedRides: [],
  disneyKnownRides: []
};

/**
 * Custom hook for managing user preferences
 * Uses MongoDB backend for persistence via API
 */
export const usePreferences = () => {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from backend on initial mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get('/api/preferences');
        setPreferences(response.data);
      } catch (error) {
        console.error('Error loading preferences from backend:', error);
        // Fall back to default preferences if backend is unavailable
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Save preferences to backend
  const savePreferences = async (newPreferences) => {
    try {
      const response = await axios.put('/api/preferences', newPreferences);
      setPreferences(response.data);
    } catch (error) {
      console.error('Error saving preferences to backend:', error);
      // Still update local state even if backend save fails
      setPreferences(newPreferences);
    }
  };

  // Update individual preference sections
  const updatePreferences = async (updates) => {
    const updated = {
      ...preferences,
      ...updates
    };
    await savePreferences(updated);
  };

  const updateFavoriteNHLTeam = async (team) => {
    const updated = {
      ...preferences,
      favoriteNHLTeam: team
    };
    await savePreferences(updated);
  };

  const updateFavoriteNFLTeam = async (team) => {
    const updated = {
      ...preferences,
      favoriteNFLTeam: team
    };
    await savePreferences(updated);
  };

  const updateWeatherLocation = async (location) => {
    const updated = {
      ...preferences,
      weatherLocation: location
    };
    await savePreferences(updated);
  };

  const updateDefaultDashboard = async (dashboard) => {
    const updated = {
      ...preferences,
      defaultDashboard: dashboard
    };
    await savePreferences(updated);
  };

  const updateDisplaySettings = async (settings) => {
    const updated = {
      ...preferences,
      displaySettings: {
        ...preferences.displaySettings,
        ...settings
      }
    };
    await savePreferences(updated);
  };

  const updateCountdownEvent = async (event) => {
    const updated = {
      ...preferences,
      countdownEvent: event
    };
    await savePreferences(updated);
  };

  // Reset to defaults
  const resetPreferences = async () => {
    try {
      const response = await axios.post('/api/preferences/reset');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      setPreferences(DEFAULT_PREFERENCES);
    }
  };

  return {
    preferences,
    loading,
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
