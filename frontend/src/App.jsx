import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import axios from 'axios'
import Layout from './components/layout/Layout'
import usePreferences from './hooks/usePreferences'
import { useAvailableSports } from './hooks/useAvailableSports'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useDashboardTracking, usePageLoadTracking } from './hooks/useUsageTracking'
import { useAuth } from './contexts/AuthContext'
import './App.css'

// Lazy load dashboard components for better initial load performance
const TodaysGames = lazy(() => import('./components/dashboards/TodaysGames'))
const UpcomingGames = lazy(() => import('./components/dashboards/UpcomingGames'))
const Standings = lazy(() => import('./components/dashboards/Standings'))
const WeatherDashboard = lazy(() => import('./components/dashboards/WeatherDashboard'))
const CountdownDashboard = lazy(() => import('./components/dashboards/CountdownDashboard'))
const DisneyDashboard = lazy(() => import('./components/dashboards/DisneyDashboard'))
const MoviesDashboard = lazy(() => import('./components/dashboards/MoviesDashboard'))
const CarWashDashboard = lazy(() => import('./components/dashboards/CarWashDashboard'))
const StocksDashboard = lazy(() => import('./components/dashboards/StocksDashboard'))
const PhotoSlideshow = lazy(() => import('./components/dashboards/PhotoSlideshow'))
const EventSlideshow = lazy(() => import('./components/dashboards/EventSlideshow'))
const Admin = lazy(() => import('./components/admin/Admin'))
const UserSettings = lazy(() => import('./components/settings/UserSettings'))

function App() {
  const {
    preferences,
    updatePreferences
  } = usePreferences();
  const { logout, user } = useAuth();

  const [currentDashboard, setCurrentDashboard] = useState(preferences.defaultDashboard)
  const [currentSubSection, setCurrentSubSection] = useState(null)
  const [photoCounts, setPhotoCounts] = useState({
    'family-photos': 0,
    'event-slides': 0
  })
  const [showUserSettings, setShowUserSettings] = useState(false)
  // Counter to force rotation timer restart on user interaction
  const [rotationResetCounter, setRotationResetCounter] = useState(0)

  // Check which sports have games available
  const availableSports = useAvailableSports()

  // Track page loads
  usePageLoadTracking();

  // Track dashboard views
  useDashboardTracking(currentDashboard, {
    subSection: currentSubSection,
    autoRotate: preferences.displaySettings?.autoRotate
  });

  // Check photo counts on mount
  useEffect(() => {
    const checkPhotoCounts = async () => {
      try {
        const [familyResponse, eventResponse] = await Promise.all([
          axios.get('/api/photos?category=family-photos&metadata=true'),
          axios.get('/api/photos?category=event-slides&metadata=true')
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
      dashboard: 'car-wash',
      subSections: null
    },
    {
      dashboard: 'stocks',
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

  // Filter dashboards based on photo and sports availability
  // Memoize to prevent unnecessary re-renders that would restart rotation timer
  const dashboardRotation = useMemo(() => {
    return allDashboards
      .map(dash => {
        // For todays-games, filter sub-sections based on available sports
        if (dash.dashboard === 'todays-games' && dash.subSections) {
          const availableSubSections = dash.subSections.filter(sport => availableSports[sport]);
          return {
            ...dash,
            subSections: availableSubSections.length > 0 ? availableSubSections : dash.subSections
          };
        }

        // For countdown, populate sub-sections from countdownEvents
        if (dash.dashboard === 'countdown') {
          const countdownEvents = preferences.countdownEvents || [];
          if (countdownEvents.length > 0) {
            return {
              ...dash,
              subSections: countdownEvents.map(event => event.id)
            };
          }
          // If no countdownEvents but legacy countdownEvent exists, use null (single countdown)
          return dash;
        }

        return dash;
      })
      .filter(dash => {
        // Filter out dashboards that require photos but have none
        if (dash.requiresPhotos) {
          return photoCounts[dash.dashboard] > 0;
        }
        return true;
      })
      .filter(dash => {
        // Filter based on user's rotation dashboard selections
        const rotationDashboards = preferences.displaySettings?.rotationDashboards;
        if (!rotationDashboards || rotationDashboards.length === 0) {
          return true; // If no preference set, include all dashboards
        }
        return rotationDashboards.includes(dash.dashboard);
      });
  }, [availableSports, preferences.countdownEvents, preferences.displaySettings?.rotationDashboards, photoCounts]);

  // Update current dashboard when default preference changes
  useEffect(() => {
    setCurrentDashboard(preferences.defaultDashboard);
  }, [preferences.defaultDashboard]);

  // Refs for rotation - using refs allows us to access current values without restarting the interval
  const rotationIntervalRef = useRef(null);
  const dashboardRotationRef = useRef(dashboardRotation);
  const currentDashboardRef = useRef(currentDashboard);
  const currentSubSectionRef = useRef(currentSubSection);

  // Keep refs in sync with state
  useEffect(() => {
    dashboardRotationRef.current = dashboardRotation;
  }, [dashboardRotation]);

  useEffect(() => {
    currentDashboardRef.current = currentDashboard;
  }, [currentDashboard]);

  useEffect(() => {
    currentSubSectionRef.current = currentSubSection;
  }, [currentSubSection]);

  // Auto-rotate dashboards - only restarts when autoRotate, interval, or reset counter changes
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate || currentDashboard === 'admin') {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
      return;
    }

    const rotateIntervalMs = (preferences.displaySettings?.rotateInterval || 30) * 1000;

    const rotateToNext = () => {
      // Use refs to get current values without causing effect to restart
      const rotation = dashboardRotationRef.current;
      const curDashboard = currentDashboardRef.current;
      const curSubSection = currentSubSectionRef.current;

      const currentDashboardIndex = rotation.findIndex(d => d.dashboard === curDashboard);
      const currentDashboardConfig = rotation[currentDashboardIndex];

      if (currentDashboardConfig?.subSections && currentDashboardConfig.subSections.length > 0) {
        const currentSubIndex = currentDashboardConfig.subSections.indexOf(curSubSection);
        const isLastSubSection = currentSubIndex === currentDashboardConfig.subSections.length - 1;

        if (curSubSection === null || currentSubIndex === -1) {
          setCurrentSubSection(currentDashboardConfig.subSections[0]);
        } else if (isLastSubSection) {
          const nextDashboardIndex = (currentDashboardIndex + 1) % rotation.length;
          const nextDashboard = rotation[nextDashboardIndex];
          setCurrentDashboard(nextDashboard.dashboard);
          setCurrentSubSection(nextDashboard.subSections ? nextDashboard.subSections[0] : null);
        } else {
          setCurrentSubSection(currentDashboardConfig.subSections[currentSubIndex + 1]);
        }
      } else {
        const nextDashboardIndex = (currentDashboardIndex + 1) % rotation.length;
        const nextDashboard = rotation[nextDashboardIndex];
        setCurrentDashboard(nextDashboard.dashboard);
        setCurrentSubSection(nextDashboard.subSections ? nextDashboard.subSections[0] : null);
      }
    };

    // Clear any existing interval
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }

    // Start rotation timer
    rotationIntervalRef.current = setInterval(rotateToNext, rotateIntervalMs);

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    };
  }, [preferences.displaySettings?.autoRotate, preferences.displaySettings?.rotateInterval, rotationResetCounter]);

  // Reset rotation timer on user interaction
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate) {
      return;
    }

    let debounceTimeout = null;

    const handleUserInteraction = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        setRotationResetCounter(c => c + 1);
      }, 300);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [preferences.displaySettings?.autoRotate]);

  const handleSaveSettings = async (newPreferences) => {
    await updatePreferences(newPreferences);
    // Don't auto-navigate away - let user stay in admin panel after saving
  };

  const handleCancelSettings = () => {
    setCurrentDashboard('todays-games'); // Return to today's games without saving
  };

  const handleAdminAccess = () => {
    // Check if user is admin
    if (user && user.isAdmin) {
      setCurrentDashboard('admin');
    } else {
      // If not admin, show an error or redirect
      alert('You must be an admin to access this section. Please contact an administrator.');
    }
  };

  const handleSettingsAccess = () => {
    setShowUserSettings(true);
  };

  const handleCloseSettings = () => {
    setShowUserSettings(false);
  };

  const handleUserLogout = () => {
    logout();
    setShowUserSettings(false);
    setCurrentDashboard('todays-games');
  };

  // Handle manual navigation in countdown (and other dashboards with sub-sections)
  // This will reset the auto-rotation timer by updating currentSubSection
  const handleManualNavigation = (newSubSection) => {
    setCurrentSubSection(newSubSection);
  };

  // Helper to wrap dashboards with error boundaries
  const withErrorBoundary = (component, dashboardName) => (
    <ErrorBoundary dashboardName={dashboardName} autoRecover={true}>
      {component}
    </ErrorBoundary>
  );

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'todays-games':
        return withErrorBoundary(
          <TodaysGames preferences={preferences} activeSport={currentSubSection} availableSports={availableSports} />,
          "Today's Games"
        );
      case 'upcoming-games':
        return withErrorBoundary(
          <UpcomingGames preferences={preferences} />,
          "Upcoming Games"
        );
      case 'standings':
        return withErrorBoundary(
          <Standings preferences={preferences} />,
          "Standings"
        );
      case 'weather':
        return withErrorBoundary(
          <WeatherDashboard preferences={preferences} />,
          "Weather"
        );
      case 'car-wash':
        return withErrorBoundary(
          <CarWashDashboard preferences={preferences} />,
          "Bob's Car Wash"
        );
      case 'stocks':
        return withErrorBoundary(
          <StocksDashboard />,
          "Market Overview"
        );
      case 'countdown':
        return withErrorBoundary(
          <CountdownDashboard
            preferences={preferences}
            activeCountdown={currentSubSection}
            onNavigate={handleManualNavigation}
          />,
          "Countdown"
        );
      case 'disney':
        return withErrorBoundary(
          <DisneyDashboard preferences={preferences} activePark={currentSubSection} />,
          "Disney Dashboard"
        );
      case 'movies':
        return withErrorBoundary(
          <MoviesDashboard preferences={preferences} />,
          "Movies"
        );
      case 'family-photos':
        return withErrorBoundary(
          <PhotoSlideshow />,
          "Family Photos"
        );
      case 'event-slides':
        return withErrorBoundary(
          <EventSlideshow />,
          "Event Slides"
        );
      case 'admin':
        if (!user || !user.isAdmin) {
          // If somehow they get here without admin access, redirect to todays-games
          setCurrentDashboard('todays-games');
          return null;
        }
        return withErrorBoundary(
          <Admin
            preferences={preferences}
            onSave={handleSaveSettings}
            onCancel={handleCancelSettings}
          />,
          "Admin Panel"
        );
      case 'settings':
        // Backward compatibility - redirect to admin with auth check
        if (!user || !user.isAdmin) {
          setCurrentDashboard('todays-games');
          return null;
        }
        return withErrorBoundary(
          <Admin
            preferences={preferences}
            onSave={handleSaveSettings}
            onCancel={handleCancelSettings}
          />,
          "Settings"
        );
      case 'sports':
        // Backward compatibility - redirect to todays-games
        return withErrorBoundary(
          <TodaysGames preferences={preferences} />,
          "Sports"
        );
      default:
        return withErrorBoundary(
          <TodaysGames preferences={preferences} />,
          "Dashboard"
        );
    }
  }

  return (
    <>
      <Layout
        currentDashboard={currentDashboard}
        onDashboardChange={setCurrentDashboard}
        onAdminAccess={handleAdminAccess}
        onSettingsAccess={handleSettingsAccess}
        photoCounts={photoCounts}
        user={user}
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
        } key={currentDashboard}>
          {renderDashboard()}
        </Suspense>
      </Layout>
      {showUserSettings && (
        <Suspense fallback={null}>
          <UserSettings
            preferences={preferences}
            onSave={handleSaveSettings}
            onClose={handleCloseSettings}
            onLogout={handleUserLogout}
          />
        </Suspense>
      )}
    </>
  )
}

export default App
