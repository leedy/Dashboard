import { useState, useEffect } from 'react';
import './DashboardControls.css';

function DashboardControls({ preferences, onSave }) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  return (
    <div className="dashboard-controls-container">
      <div className="controls-header">
        <h2>Dashboard Controls</h2>
        <p className="controls-subtitle">Configure auto-rotation and dashboard settings</p>
      </div>

      <div className="controls-content">
        {/* Auto-Rotation Section */}
        <div className="controls-section">
          <h3>Auto-Rotation</h3>

          <div className="control-item">
            <label htmlFor="auto-rotate" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                id="auto-rotate"
                type="checkbox"
                checked={localPrefs.displaySettings?.autoRotate || false}
                onChange={(e) => {
                  const updatedPrefs = {
                    ...localPrefs,
                    displaySettings: {
                      ...localPrefs.displaySettings,
                      autoRotate: e.target.checked
                    }
                  };
                  setLocalPrefs(updatedPrefs);
                  onSave(updatedPrefs);
                }}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>Enable Auto-Rotate Dashboards</span>
            </label>
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block', marginLeft: '1.75rem' }}>
              Automatically cycle through selected dashboards
            </small>
          </div>

          <div className="control-item">
            <label htmlFor="rotate-interval">Rotation Interval (seconds)</label>
            <input
              id="rotate-interval"
              type="number"
              min="5"
              max="300"
              value={localPrefs.displaySettings?.rotateInterval || 30}
              onChange={(e) => {
                const updatedPrefs = {
                  ...localPrefs,
                  displaySettings: {
                    ...localPrefs.displaySettings,
                    rotateInterval: parseInt(e.target.value) || 30
                  }
                };
                setLocalPrefs(updatedPrefs);
                onSave(updatedPrefs);
              }}
              placeholder="Enter seconds (5-300)"
              disabled={!localPrefs.displaySettings?.autoRotate}
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              How long to show each dashboard before rotating to the next
            </small>
          </div>
        </div>

        {/* Dashboard Selection Section */}
        <div className="controls-section">
          <h3>Rotation Dashboard Selection</h3>
          <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '1rem' }}>
            Select which dashboards to include in the auto-rotation cycle
          </p>

          <div className="dashboard-selection-grid">
            {[
              { id: 'todays-games', label: "Today's Games", icon: '🏒' },
              { id: 'upcoming-games', label: 'Upcoming Games', icon: '📅' },
              { id: 'standings', label: 'Standings', icon: '🏆' },
              { id: 'weather', label: 'Weather', icon: '🌤️' },
              { id: 'car-wash', label: "Bob's Car Wash", icon: '🚗' },
              { id: 'stocks', label: 'Market Overview', icon: '📈' },
              { id: 'countdown', label: 'Countdown', icon: '⏱️' },
              { id: 'disney', label: 'Disney Info', icon: '🏰' },
              { id: 'movies', label: 'Movies', icon: '🎬' },
              { id: 'family-photos', label: 'Family Photos', icon: '📷' },
              { id: 'event-slides', label: 'Event Slides', icon: '🖼️' }
            ].map(dashboard => (
              <label key={dashboard.id} className={`dashboard-option ${(localPrefs.displaySettings?.rotationDashboards || []).includes(dashboard.id) ? 'selected' : ''} ${!localPrefs.displaySettings?.autoRotate ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={(localPrefs.displaySettings?.rotationDashboards || []).includes(dashboard.id)}
                  onChange={(e) => {
                    const currentDashboards = localPrefs.displaySettings?.rotationDashboards || [];
                    const newDashboards = e.target.checked
                      ? [...currentDashboards, dashboard.id]
                      : currentDashboards.filter(d => d !== dashboard.id);

                    const updatedPrefs = {
                      ...localPrefs,
                      displaySettings: {
                        ...localPrefs.displaySettings,
                        rotationDashboards: newDashboards
                      }
                    };
                    setLocalPrefs(updatedPrefs);
                    onSave(updatedPrefs);
                  }}
                  disabled={!localPrefs.displaySettings?.autoRotate}
                />
                <span className="dashboard-icon">{dashboard.icon}</span>
                <span className="dashboard-name">{dashboard.label}</span>
              </label>
            ))}
          </div>

          {!localPrefs.displaySettings?.autoRotate && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 183, 77, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 183, 77, 0.3)' }}>
              <p style={{ margin: 0, color: '#ffb74d', fontSize: '0.9rem' }}>
                ℹ️ Enable auto-rotate above to select dashboards for rotation
              </p>
            </div>
          )}
        </div>

        {/* Default Dashboard Section */}
        <div className="controls-section">
          <h3>Default Dashboard</h3>

          <div className="control-item">
            <label htmlFor="default-dashboard">Dashboard to Show on Startup</label>
            <select
              id="default-dashboard"
              value={localPrefs.defaultDashboard === 'sports' ? 'todays-games' : localPrefs.defaultDashboard}
              onChange={(e) => {
                const updatedPrefs = {
                  ...localPrefs,
                  defaultDashboard: e.target.value
                };
                setLocalPrefs(updatedPrefs);
                onSave(updatedPrefs);
              }}
            >
              <option value="todays-games">Today's Games</option>
              <option value="upcoming-games">Upcoming Games</option>
              <option value="standings">Standings</option>
              <option value="weather">Weather</option>
              <option value="car-wash">Bob's Car Wash</option>
              <option value="stocks">Market Overview</option>
              <option value="countdown">Countdown</option>
              <option value="disney">Disney Info</option>
              <option value="movies">Movies</option>
              <option value="family-photos">Family Photos</option>
              <option value="event-slides">Event Slides</option>
            </select>
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              The dashboard that appears when you first load the app
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardControls;
