# Dashboard - Kiosk Controller Integration

This document outlines changes needed to integrate the Dashboard app with the Kiosk Controller.

## Goal

Add a `/kiosk` route that:
- Skips authentication (no login required)
- Accepts URL parameters to control which dashboards display
- Auto-rotates through specified dashboards
- Hides navigation chrome (sidebar, header)

## New Route Format

```
/kiosk?dashboards=weather,disney,stocks&rotation=30
```

**Parameters:**
- `dashboards` - Comma-separated list of dashboard keys to display
- `rotation` - Seconds between dashboard changes (default: 30)

**Valid dashboard keys:**
- `todays-games`
- `upcoming-games`
- `standings`
- `weather`
- `car-wash`
- `stocks`
- `countdown`
- `disney`
- `movies`
- `family-photos`
- `event-slides`

## Files to Modify

### 1. `frontend/src/main.jsx`

Detect kiosk mode and bypass AuthProvider:

```jsx
import KioskApp from './KioskApp'

const isKioskMode = window.location.pathname === '/kiosk'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {isKioskMode ? (
        <Routes>
          <Route path="/kiosk" element={<KioskApp />} />
        </Routes>
      ) : (
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<UserLogin />} />
            <Route path="/register" element={<UserRegistration />} />
            <Route path="/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      )}
    </BrowserRouter>
  </StrictMode>
)
```

### 2. Create `frontend/src/KioskApp.jsx`

New component for kiosk mode:

```jsx
import { useState, useEffect, lazy, Suspense } from 'react'
import './App.css'

// Lazy load dashboards (copy from App.jsx)
const WeatherDashboard = lazy(() => import('./components/dashboards/WeatherDashboard'))
const DisneyDashboard = lazy(() => import('./components/dashboards/DisneyDashboard'))
// ... other dashboards

// Default preferences for kiosk mode (no user login)
const KIOSK_PREFERENCES = {
  // Copy DEFAULT_PREFERENCES from usePreferences.js
  // Or fetch from a dedicated kiosk config endpoint
}

function KioskApp() {
  const searchParams = new URLSearchParams(window.location.search)
  const dashboardList = searchParams.get('dashboards')?.split(',') || ['weather']
  const rotationInterval = parseInt(searchParams.get('rotation')) || 30

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentSubSection, setCurrentSubSection] = useState(null)

  // Rotation timer
  useEffect(() => {
    if (dashboardList.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex(i => (i + 1) % dashboardList.length)
    }, rotationInterval * 1000)

    return () => clearInterval(timer)
  }, [dashboardList.length, rotationInterval])

  const currentDashboard = dashboardList[currentIndex]

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'weather':
        return <WeatherDashboard preferences={KIOSK_PREFERENCES} />
      case 'disney':
        return <DisneyDashboard preferences={KIOSK_PREFERENCES} activePark={currentSubSection} />
      // ... handle all dashboard cases from App.jsx
      default:
        return <div>Unknown dashboard: {currentDashboard}</div>
    }
  }

  return (
    <div className="kiosk-mode">
      <Suspense fallback={<div className="loading">Loading...</div>}>
        {renderDashboard()}
      </Suspense>
    </div>
  )
}

export default KioskApp
```

### 3. Add CSS for kiosk mode in `frontend/src/App.css`

```css
.kiosk-mode {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.kiosk-mode .loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #666;
}
```

## Optional Enhancements

### Sub-section rotation for Disney

For Disney dashboard, could accept park list:
```
/kiosk?dashboards=disney&parks=magic-kingdom,epcot&rotation=30
```

### Kiosk preferences endpoint

Instead of hardcoded defaults, create an API endpoint:
```
GET /api/kiosk/preferences?key=living-room
```

This would allow the Kiosk Controller to push per-kiosk preferences.

## Testing

1. Start Dashboard: `npm run dev`
2. Open: `http://localhost:5173/kiosk?dashboards=weather`
3. Should show weather without login prompt
4. Try: `http://localhost:5173/kiosk?dashboards=weather,disney&rotation=10`
5. Should rotate every 10 seconds

## Example URLs for Kiosk Controller

```
# Weather only
http://192.168.1.27:3001/kiosk?dashboards=weather

# Disney parks rotation
http://192.168.1.27:3001/kiosk?dashboards=disney&rotation=60

# Multi-dashboard rotation
http://192.168.1.27:3001/kiosk?dashboards=weather,disney,stocks&rotation=30
```
