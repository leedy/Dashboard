import { useState, useEffect } from 'react'
import Layout from './components/layout/Layout'
import SportsDashboard from './components/dashboards/SportsDashboard'
import WeatherDashboard from './components/dashboards/WeatherDashboard'
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
    setCurrentDashboard('sports'); // Return to sports after saving
  };

  const handleCancelSettings = () => {
    setCurrentDashboard('sports'); // Return to sports without saving
  };

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'sports':
        return <SportsDashboard preferences={preferences} />
      case 'weather':
        return <WeatherDashboard preferences={preferences} />
      case 'settings':
        return (
          <Settings
            preferences={preferences}
            onSave={handleSaveSettings}
            onCancel={handleCancelSettings}
          />
        )
      case 'disney':
        return <div>Disney Dashboard - Coming Soon!</div>
      default:
        return <SportsDashboard preferences={preferences} />
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
