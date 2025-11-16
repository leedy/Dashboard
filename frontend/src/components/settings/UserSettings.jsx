import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminSettings from '../admin/AdminSettings';
import DashboardControls from '../admin/DashboardControls';
import CountdownManagement from '../admin/CountdownManagement';
import UserPhotos from './UserPhotos';
import DisneyRideSelection from '../admin/DisneyRideSelection';
import './UserSettings.css';

function UserSettings({ preferences, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('personal');
  const { user } = useAuth();

  return (
    <div className="user-settings-overlay">
      <div className="user-settings-container">
        <div className="user-settings-header">
          <div>
            <h1>Settings</h1>
            <p className="user-info">Logged in as: <strong>{user?.displayName || user?.username}</strong></p>
          </div>
          <button className="settings-close-button" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div className="user-settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal
          </button>
          <button
            className={`settings-tab ${activeTab === 'dashboards' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboards')}
          >
            Dashboards
          </button>
          <button
            className={`settings-tab ${activeTab === 'countdowns' ? 'active' : ''}`}
            onClick={() => setActiveTab('countdowns')}
          >
            Countdowns
          </button>
          <button
            className={`settings-tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            My Photos
          </button>
          <button
            className={`settings-tab ${activeTab === 'disney' ? 'active' : ''}`}
            onClick={() => setActiveTab('disney')}
          >
            Disney
          </button>
        </div>

        <div className="user-settings-content">
          {activeTab === 'personal' && (
            <AdminSettings
              preferences={preferences}
              onSave={onSave}
            />
          )}
          {activeTab === 'dashboards' && (
            <DashboardControls
              preferences={preferences}
              onSave={onSave}
            />
          )}
          {activeTab === 'countdowns' && (
            <CountdownManagement
              preferences={preferences}
              onSave={onSave}
            />
          )}
          {activeTab === 'photos' && (
            <UserPhotos />
          )}
          {activeTab === 'disney' && (
            <DisneyRideSelection
              preferences={preferences}
              onSave={onSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default UserSettings;
