import { useState } from 'react';
import AdminSettings from './AdminSettings';
import DashboardControls from './DashboardControls';
import CountdownManagement from './CountdownManagement';
import PhotoManagement from './PhotoManagement';
import DisneyRideSelection from './DisneyRideSelection';
import UsageAnalytics from './UsageAnalytics';
import './Admin.css';

function Admin({ preferences, onSave, onCancel }) {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button className="admin-close-button" onClick={onCancel}>
          ✕ Close
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`admin-tab ${activeTab === 'dashboards' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboards')}
        >
          Dashboard Controls
        </button>
        <button
          className={`admin-tab ${activeTab === 'countdowns' ? 'active' : ''}`}
          onClick={() => setActiveTab('countdowns')}
        >
          Countdowns
        </button>
        <button
          className={`admin-tab ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photo Management
        </button>
        <button
          className={`admin-tab ${activeTab === 'disney' ? 'active' : ''}`}
          onClick={() => setActiveTab('disney')}
        >
          Disney Settings
        </button>
        <button
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Usage Analytics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'settings' && (
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
          <PhotoManagement />
        )}
        {activeTab === 'disney' && (
          <DisneyRideSelection
            preferences={preferences}
            onSave={onSave}
          />
        )}
        {activeTab === 'analytics' && (
          <UsageAnalytics />
        )}
      </div>
    </div>
  );
}

export default Admin;
