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

  // Ref for debounce timeout on user interaction
  const rotationDebounceRef = useRef(null);

  // Auto-rotate dashboards with sub-section support
  // This single effect manages all rotation - restarts when rotationResetCounter changes (user interaction)
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate || currentDashboard === 'admin') {
      return;
    }

    const rotateInterval = (preferences.displaySettings?.rotateInterval || 30) * 1000; // Convert to milliseconds

    const rotateToNext = () => {
      // Find current dashboard config
      const currentDashboardIndex = dashboardRotation.findIndex(d => d.dashboard === currentDashboard);
      const currentDashboardConfig = dashboardRotation[currentDashboardIndex];

      // Check if current dashboard has sub-sections
      if (currentDashboardConfig?.subSections && currentDashboardConfig.subSections.length > 0) {
        const currentSubIndex = currentDashboardConfig.subSections.indexOf(currentSubSection);
        const isLastSubSection = currentSubIndex === currentDashboardConfig.subSections.length - 1;

        if (currentSubSection === null || currentSubIndex === -1) {
          // Initialize to first sub-section if not set or invalid
          setCurrentSubSection(currentDashboardConfig.subSections[0]);
        } else if (isLastSubSection) {
          // Move to next dashboard and set its first sub-section (if any)
          const nextDashboardIndex = (currentDashboardIndex + 1) % dashboardRotation.length;
          const nextDashboard = dashboardRotation[nextDashboardIndex];

          setCurrentDashboard(nextDashboard.dashboard);
          setCurrentSubSection(nextDashboard.subSections ? nextDashboard.subSections[0] : null);
        } else {
          // Move to next sub-section in current dashboard
          setCurrentSubSection(currentDashboardConfig.subSections[currentSubIndex + 1]);
        }
      } else {
        // No sub-sections, just move to next dashboard
        const nextDashboardIndex = (currentDashboardIndex + 1) % dashboardRotation.length;
        const nextDashboard = dashboardRotation[nextDashboardIndex];

        setCurrentDashboard(nextDashboard.dashboard);
        setCurrentSubSection(nextDashboard.subSections ? nextDashboard.subSections[0] : null);
      }
    };

    // Start rotation timer
    const intervalId = setInterval(rotateToNext, rotateInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [preferences.displaySettings?.autoRotate, preferences.displaySettings?.rotateInterval, preferences.displaySettings?.rotationDashboards, currentDashboard, currentSubSection, dashboardRotation, rotationResetCounter]);

  // Reset rotation timer on user interaction by incrementing the reset counter
  // This causes the rotation effect above to restart with a fresh timer
  useEffect(() => {
    if (!preferences.displaySettings?.autoRotate || currentDashboard === 'admin') {
      return;
    }

    const handleUserInteraction = () => {
      // Debounce rapid interactions
      if (rotationDebounceRef.current) {
        clearTimeout(rotationDebounceRef.current);
      }
      rotationDebounceRef.current = setTimeout(() => {
        setRotationResetCounter(c => c + 1);
      }, 300);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      if (rotationDebounceRef.current) {
        clearTimeout(rotationDebounceRef.current);
      }
    };
  }, [preferences.displaySettings?.autoRotate, currentDashboard]);

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
