import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import TodaysGames from './components/dashboards/TodaysGames'
import Standings from './components/dashboards/Standings'
import WeatherDashboard from './components/dashboards/WeatherDashboard'
import CountdownDashboard from './components/dashboards/CountdownDashboard'
import DisneyDashboard from './components/dashboards/DisneyDashboard'
import MoviesDashboard from './components/dashboards/MoviesDashboard'
import ISSTracker from './components/dashboards/ISSTracker'
import FantasyFootball from './components/dashboards/FantasyFootball'
import Settings from './components/settings/Settings'
import usePreferences from './hooks/usePreferences'
import './App.css'

function App() {
  const {
    preferences,
    updatePreferences,
    updateFavoriteNHLTeam,
    updateFavoriteNFLTeam,
    updateWeatherLocation,
    updateDefaultDashboard
  } = usePreferences();

  const [currentDashboard, setCurrentDashboard] = useState(preferences.defaultDashboard)

  // Define available dashboards for rotation (excluding settings)
  const rotatableDashboards = [
    'todays-games',
    'standings',
    'weather',
    'countdown',
    'disney',
    'movies',
    'iss-tracker',
    'fantasy-football'
  ];

  // Update current dashboard when default preference changes
  useEffect(() => {
    setCurrentDashboard(preferences.defaultDashboard);
  }, [preferences.defaultDashboard]);

  // Auto-rotate dashboards
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate || currentDashboard === 'settings') {
      return;
    }

    const rotateInterval = (preferences.displaySettings?.rotateInterval || 30) * 1000; // Convert to milliseconds

    const intervalId = setInterval(() => {
      setCurrentDashboard(current => {
        // Find current index in rotatable dashboards
        const currentIndex = rotatableDashboards.indexOf(current);
        // Move to next dashboard, or wrap to first if at end
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % rotatableDashboards.length;
        return rotatableDashboards[nextIndex];
      });
    }, rotateInterval);

    return () => clearInterval(intervalId);
  }, [preferences.displaySettings?.autoRotate, preferences.displaySettings?.rotateInterval, currentDashboard]);

  const handleSaveSettings = (newPreferences) => {
    updatePreferences(newPreferences);
    setCurrentDashboard('todays-games'); // Return to today's games after saving
  };

  const handleCancelSettings = () => {
    setCurrentDashboard('todays-games'); // Return to today's games without saving
  };

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'todays-games':
        return <TodaysGames preferences={preferences} />
      case 'standings':
        return <Standings preferences={preferences} />
      case 'weather':
        return <WeatherDashboard preferences={preferences} />
      case 'countdown':
        return <CountdownDashboard preferences={preferences} />
      case 'disney':
        return <DisneyDashboard preferences={preferences} />
      case 'movies':
        return <MoviesDashboard preferences={preferences} />
      case 'iss-tracker':
        return <ISSTracker />
      case 'fantasy-football':
        return <FantasyFootball />
      case 'settings':
        return (
          <Settings
            preferences={preferences}
            onSave={handleSaveSettings}
            onCancel={handleCancelSettings}
          />
        )
      case 'sports':
        // Backward compatibility - redirect to todays-games
        return <TodaysGames preferences={preferences} />
      default:
        return <TodaysGames preferences={preferences} />
    }
  }

  return (
    <Layout
      currentDashboard={currentDashboard}
      onDashboardChange={setCurrentDashboard}
    >
      {renderDashboard()}
    </Layout>
  )
}

export default App
