import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import TodaysGames from './components/dashboards/TodaysGames'
import Standings from './components/dashboards/Standings'
import WeatherDashboard from './components/dashboards/WeatherDashboard'
import CountdownDashboard from './components/dashboards/CountdownDashboard'
import DisneyDashboard from './components/dashboards/DisneyDashboard'
import MoviesDashboard from './components/dashboards/MoviesDashboard'
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

  // Update current dashboard when default preference changes
  useEffect(() => {
    setCurrentDashboard(preferences.defaultDashboard);
  }, [preferences.defaultDashboard]);

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
