import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Load preferences from backend on initial mount
  useEffect(() => {
    const fetchPreferences = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Only fetch if user is authenticated
      if (!isAuthenticated) {
        setPreferences(DEFAULT_PREFERENCES);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/preferences');
        setPreferences(response.data);
      } catch (error) {
        // Only log error if it's not a 401 (not authenticated)
        // Users who aren't logged in will just use default preferences
        if (error.response?.status !== 401) {
          console.error('Error loading preferences from backend:', error);
        }
        // Fall back to default preferences if backend is unavailable or user not authenticated
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [isAuthenticated, authLoading]);

  // Save preferences to backend
  const savePreferences = async (newPreferences) => {
    try {
      const response = await axios.put('/api/preferences', newPreferences);
      setPreferences(response.data);
    } catch (error) {
      // Only log error if it's not a 401 (not authenticated)
      if (error.response?.status !== 401) {
        console.error('Error saving preferences to backend:', error);
      }
      // Still update local state even if backend save fails
      setPreferences(newPreferences);
    }
  };

  // Update individual preference sections
  const updatePreferences = async (updates) => {
    try {
      // Fetch latest preferences from backend to avoid race conditions
      const response = await axios.get('/api/preferences');
      const latestPreferences = response.data;

      // Merge with latest data
      const updated = {
        ...latestPreferences,
        ...updates
      };
      await savePreferences(updated);
    } catch (error) {
      // If fetch fails, fall back to local state
      console.warn('Failed to fetch latest preferences, using local state:', error);
      const updated = {
        ...preferences,
        ...updates
      };
      await savePreferences(updated);
    }
  };

  const updateFavoriteNHLTeam = async (team) => {
    await updatePreferences({ favoriteNHLTeam: team });
  };

  const updateFavoriteNFLTeam = async (team) => {
    await updatePreferences({ favoriteNFLTeam: team });
  };

  const updateWeatherLocation = async (location) => {
    await updatePreferences({ weatherLocation: location });
  };

  const updateDefaultDashboard = async (dashboard) => {
    await updatePreferences({ defaultDashboard: dashboard });
  };

  const updateDisplaySettings = async (settings) => {
    try {
      // Fetch latest to get current displaySettings
      const response = await axios.get('/api/preferences');
      const latestPreferences = response.data;

      await updatePreferences({
        displaySettings: {
          ...latestPreferences.displaySettings,
          ...settings
        }
      });
    } catch (error) {
      console.warn('Failed to fetch latest for display settings, using local state:', error);
      await updatePreferences({
        displaySettings: {
          ...preferences.displaySettings,
          ...settings
        }
      });
    }
  };

  const updateCountdownEvent = async (event) => {
    await updatePreferences({ countdownEvent: event });
  };

  // Reset to defaults
  const resetPreferences = async () => {
    try {
      const response = await axios.post('/api/preferences/reset');
      setPreferences(response.data);
    } catch (error) {
      // Only log error if it's not a 401 (not authenticated)
      if (error.response?.status !== 401) {
        console.error('Error resetting preferences:', error);
      }
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
