import { useState, useEffect } from 'react';
import './AdminSystemSettings.css';

function AdminSystemSettings({ preferences, onSave }) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleClearLocalData = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    localStorage.clear();
    sessionStorage.clear();
    setClearConfirm(false);
    window.location.href = '/login';
  };

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  return (
    <div className="admin-system-settings">
      <div className="system-settings-header">
        <h2>System Settings</h2>
        <p className="system-settings-subtitle">Configure system-wide settings that apply to all users</p>
      </div>

      <div className="system-settings-content">
        {/* API Keys Section */}
        <div className="system-settings-section">
          <h3>API Keys</h3>
          <p className="section-description">
            These API keys are used system-wide for all users
          </p>

          <div className="setting-item">
            <label htmlFor="tmdb-api-key">TMDb API Key</label>
            <input
              id="tmdb-api-key"
              type="text"
              value={localPrefs.tmdbApiKey || ''}
              onChange={(e) => {
                const updatedPrefs = {
                  ...localPrefs,
                  tmdbApiKey: e.target.value
                };
                setLocalPrefs(updatedPrefs);
                onSave(updatedPrefs);
              }}
              placeholder="Enter TMDb API key"
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Get a free API key at{' '}
              <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7' }}>
                themoviedb.org/settings/api
              </a>
            </small>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="system-settings-section">
          <h3>Troubleshooting</h3>
          <p className="section-description">
            Tools for resolving common issues
          </p>

          <div className="setting-item">
            <label>Clear Browser Data</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                onClick={handleClearLocalData}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: clearConfirm ? '#f44336' : '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {clearConfirm ? 'Click Again to Confirm' : 'Clear Local Data'}
              </button>
              {clearConfirm && (
                <button
                  onClick={() => setClearConfirm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
              Clears all cached data and authentication tokens. You will need to log in again.
              Use this if you're experiencing issues with settings not saving or authentication problems.
            </small>
          </div>
        </div>

        <div className="system-settings-info">
          <p>💡 <strong>Note:</strong> Changes to system settings affect all users of the dashboard.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminSystemSettings;
