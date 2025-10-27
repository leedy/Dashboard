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
  const [currentSubSection, setCurrentSubSection] = useState(null)

  // Define available dashboards with their sub-sections for rotation
  const dashboardRotation = [
    {
      dashboard: 'todays-games',
      subSections: ['nhl', 'nfl', 'mlb']
    },
    {
      dashboard: 'standings',
      subSections: null
    },
    {
      dashboard: 'weather',
      subSections: null
    },
    {
      dashboard: 'countdown',
      subSections: null
    },
    {
      dashboard: 'disney',
      subSections: ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom']
    },
    {
      dashboard: 'movies',
      subSections: null
    },
    {
      dashboard: 'family-photos',
      subSections: null
    },
    {
      dashboard: 'event-slides',
      subSections: null
    }
  ];

  // Legacy array for backward compatibility
  const rotatableDashboards = dashboardRotation.map(d => d.dashboard);

  // Update current dashboard when default preference changes
  useEffect(() => {
    setCurrentDashboard(preferences.defaultDashboard);
  }, [preferences.defaultDashboard]);

  // Auto-rotate dashboards with sub-section support
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate || currentDashboard === 'admin') {
      return;
    }

    const rotateInterval = (preferences.displaySettings?.rotateInterval || 30) * 1000; // Convert to milliseconds

    const intervalId = setInterval(() => {
      // Find current dashboard config
      const currentDashboardIndex = dashboardRotation.findIndex(d => d.dashboard === currentDashboard);
      const currentDashboardConfig = dashboardRotation[currentDashboardIndex];

      // Check if current dashboard has sub-sections
      if (currentDashboardConfig?.subSections && currentDashboardConfig.subSections.length > 0) {
        const currentSubIndex = currentDashboardConfig.subSections.indexOf(currentSubSection);
        const isLastSubSection = currentSubIndex === currentDashboardConfig.subSections.length - 1;

        if (currentSubSection === null || isLastSubSection) {
          // Move to next dashboard and set its first sub-section (if any)
          const nextDashboardIndex = (currentDashboardIndex + 1) % dashboardRotation.length;
          const nextDashboard = dashboardRotation[nextDashboardIndex];

          setCurrentDashboard(nextDashboard.dashboard);
          setCurrentSubSection(nextDashboard.subSections ? nextDashboard.subSections[0] : null);
        } else {
          // Move to next sub-section in current dashboard
          const nextSubIndex = currentSubIndex === -1 ? 0 : currentSubIndex + 1;
          setCurrentSubSection(currentDashboardConfig.subSections[nextSubIndex]);
        }
      } else {
        // No sub-sections, just move to next dashboard
        const nextDashboardIndex = (currentDashboardIndex + 1) % dashboardRotation.length;
        const nextDashboard = dashboardRotation[nextDashboardIndex];

        setCurrentDashboard(nextDashboard.dashboard);
        setCurrentSubSection(nextDashboard.subSections ? nextDashboard.subSections[0] : null);
      }
    }, rotateInterval);

    return () => clearInterval(intervalId);
  }, [preferences.displaySettings?.autoRotate, preferences.displaySettings?.rotateInterval, currentDashboard, currentSubSection]);

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
        return <TodaysGames preferences={preferences} activeSport={currentSubSection} />
      case 'standings':
        return <Standings preferences={preferences} />
      case 'weather':
        return <WeatherDashboard preferences={preferences} />
      case 'countdown':
        return <CountdownDashboard preferences={preferences} />
      case 'disney':
        return <DisneyDashboard preferences={preferences} activePark={currentSubSection} />
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
