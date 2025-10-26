import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import TodaysGames from './components/dashboards/TodaysGames'
import Standings from './components/dashboards/Standings'
import WeatherDashboard from './components/dashboards/WeatherDashboard'
import CountdownDashboard from './components/dashboards/CountdownDashboard'
import DisneyDashboard from './components/dashboards/DisneyDashboard'
import MoviesDashboard from './components/dashboards/MoviesDashboard'
import PhotoSlideshow from './components/dashboards/PhotoSlideshow'
import EventSlideshow from './components/dashboards/EventSlideshow'
import Admin from './components/admin/Admin'
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

  // Define available dashboards for rotation (excluding admin)
  const rotatableDashboards = [
    'todays-games',
    'standings',
    'weather',
    'countdown',
    'disney',
    'movies',
    'family-photos',
    'event-slides'
  ];

  // Update current dashboard when default preference changes
  useEffect(() => {
    setCurrentDashboard(preferences.defaultDashboard);
  }, [preferences.defaultDashboard]);

  // Auto-rotate dashboards
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate || currentDashboard === 'admin') {
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

  const handleSaveSettings = async (newPreferences) => {
    await updatePreferences(newPreferences);
    // Don't auto-navigate away - let user stay in admin panel after saving
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
      case 'family-photos':
        return <PhotoSlideshow />
      case 'event-slides':
        return <EventSlideshow />
      case 'admin':
        return (
          <Admin
            preferences={preferences}
            onSave={handleSaveSettings}
            onCancel={handleCancelSettings}
          />
        )
      case 'settings':
        // Backward compatibility - redirect to admin
        return (
          <Admin
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
