import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSystemSettings from './AdminSystemSettings';
import PhotoManagement from './PhotoManagement';
import UsageAnalytics from './UsageAnalytics';
import './Admin.css';

function Admin({ preferences, onSave, onCancel, onLogout }) {
  const [activeTab, setActiveTab] = useState('system');
  const [systemPreferences, setSystemPreferences] = useState(null);
  const [loadingSystem, setLoadingSystem] = useState(true);

  // Load system-wide preferences for System Settings tab
  useEffect(() => {
    const loadSystemPreferences = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        // Fetch the default-user preferences which contains system-wide settings
        const response = await axios.get('/api/preferences?userId=default-user', {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        setSystemPreferences(response.data);
      } catch (error) {
        console.error('Error loading system preferences:', error);
        // Fallback to regular preferences if system load fails
        setSystemPreferences(preferences);
      } finally {
        setLoadingSystem(false);
      }
    };

    loadSystemPreferences();
  }, [preferences]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-header-actions">
          {onLogout && (
            <button className="admin-logout-button" onClick={onLogout}>
              🚪 Logout
            </button>
          )}
          <button className="admin-close-button" onClick={onCancel}>
            ✕ Close
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          System Settings
        </button>
        <button
          className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photo Management
        </button>
        <button
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Usage Analytics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'system' && (
          loadingSystem ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
              Loading system settings...
            </div>
          ) : (
            <AdminSystemSettings
              preferences={systemPreferences}
              onSave={async (updatedPrefs) => {
                try {
                  const adminToken = localStorage.getItem('adminToken');
                  // Save to default-user (system-wide settings)
                  await axios.put('/api/preferences?userId=default-user', updatedPrefs, {
                    headers: {
                      Authorization: `Bearer ${adminToken}`
                    }
                  });
                  setSystemPreferences(updatedPrefs);
                } catch (error) {
                  console.error('Error saving system preferences:', error);
                }
              }}
            />
          )
        )}
        {activeTab === 'photos' && (
          <PhotoManagement />
        )}
        {activeTab === 'analytics' && (
          <UsageAnalytics />
        )}
      </div>

      <div className="admin-info">
        <p>💡 <strong>Tip:</strong> Use the Settings button in the navigation to manage your personal preferences (teams, weather, countdowns, etc.)</p>
      </div>
    </div>
  );
}

export default Admin;
