import { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import Layout from './components/layout/Layout'
import usePreferences from './hooks/usePreferences'
import './App.css'

// Lazy load dashboard components for better initial load performance
const TodaysGames = lazy(() => import('./components/dashboards/TodaysGames'))
const UpcomingGames = lazy(() => import('./components/dashboards/UpcomingGames'))
const Standings = lazy(() => import('./components/dashboards/Standings'))
const WeatherDashboard = lazy(() => import('./components/dashboards/WeatherDashboard'))
const CountdownDashboard = lazy(() => import('./components/dashboards/CountdownDashboard'))
const DisneyDashboard = lazy(() => import('./components/dashboards/DisneyDashboard'))
const MoviesDashboard = lazy(() => import('./components/dashboards/MoviesDashboard'))
const PhotoSlideshow = lazy(() => import('./components/dashboards/PhotoSlideshow'))
const EventSlideshow = lazy(() => import('./components/dashboards/EventSlideshow'))
const Admin = lazy(() => import('./components/admin/Admin'))

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
  const [photoCounts, setPhotoCounts] = useState({
    'family-photos': 0,
    'event-slides': 0
  })

  // Check photo counts on mount
  useEffect(() => {
    const checkPhotoCounts = async () => {
      try {
        const [familyResponse, eventResponse] = await Promise.all([
          axios.get('/api/photos?category=family-photos'),
          axios.get('/api/photos?category=event-slides')
        ]);

        setPhotoCounts({
          'family-photos': familyResponse.data.length,
          'event-slides': eventResponse.data.length
        });
      } catch (error) {
        console.error('Error checking photo counts:', error);
      }
    };

    checkPhotoCounts();
  }, []);

  // Define available dashboards with their sub-sections for rotation
  const allDashboards = [
    {
      dashboard: 'todays-games',
      subSections: ['nhl', 'nfl', 'mlb']
    },
    {
      dashboard: 'upcoming-games',
      subSections: null
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
      subSections: null,
      requiresPhotos: true
    },
    {
      dashboard: 'event-slides',
      subSections: null,
      requiresPhotos: true
    }
  ];

  // Filter dashboards based on photo availability
  const dashboardRotation = allDashboards.filter(dash => {
    if (dash.requiresPhotos) {
      return photoCounts[dash.dashboard] > 0;
    }
    return true;
  });

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

        if (currentSubSection === null) {
          // Initialize to first sub-section if not set
          setCurrentSubSection(currentDashboardConfig.subSections[0]);
        } else if (isLastSubSection) {
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
      case 'upcoming-games':
        return <UpcomingGames preferences={preferences} />
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
      photoCounts={photoCounts}
    >
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.5rem',
          color: '#666'
        }}>
          Loading dashboard...
        </div>
      }>
        {renderDashboard()}
      </Suspense>
    </Layout>
  )
}

export default App
