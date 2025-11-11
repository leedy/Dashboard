import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook to check which sports have games scheduled for today
 * Returns an object with sport availability: { nhl: boolean, nfl: boolean, mlb: boolean }
 */
export function useAvailableSports() {
  const [availableSports, setAvailableSports] = useState({
    nhl: false,
    nfl: false,
    mlb: false,
    loading: true
  });

  useEffect(() => {
    const checkAvailability = async () => {
      const results = { loading: false };

      // Check each sport in parallel
      const checks = ['nhl', 'nfl', 'mlb'].map(async (sport) => {
        try {
          const response = await axios.get(`/api/games/${sport}`);
          const apiData = response.data.data;

          // Check if there are games based on sport type
          let hasGames = false;
          if (sport === 'nhl') {
            hasGames = (apiData.games || []).length > 0;
          } else if (sport === 'nfl' || sport === 'mlb') {
            hasGames = (apiData.events || []).length > 0;
          }

          results[sport] = hasGames;
        } catch (error) {
          console.error(`Error checking ${sport} availability:`, error);
          results[sport] = false; // Assume no games if error
        }
      });

      await Promise.all(checks);
      setAvailableSports(results);
    };

    checkAvailability();

    // Refresh every 5 minutes to detect when games become available
    const interval = setInterval(checkAvailability, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return availableSports;
}
