import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminDisneyTracking.css';

function AdminDisneyTracking() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intervalMinutes, setIntervalMinutes] = useState(5);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/disney/tracking/status');
      setStatus(response.data);
      setIntervalMinutes(response.data.config.collectionIntervalMinutes || 5);
      setError(null);
    } catch (err) {
      console.error('Error fetching tracking status:', err);
      setError('Failed to load tracking status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await axios.post('/api/disney/tracking/start', { intervalMinutes });
      await fetchStatus();
    } catch (err) {
      console.error('Error starting collection:', err);
      setError('Failed to start data collection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await axios.post('/api/disney/tracking/stop');
      await fetchStatus();
    } catch (err) {
      console.error('Error stopping collection:', err);
      setError('Failed to stop data collection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectNow = async () => {
    setActionLoading(true);
    try {
      const response = await axios.post('/api/disney/tracking/collect-now');
      await fetchStatus();
      alert(`Collection complete! Created ${response.data.snapshotsCreated} snapshots.`);
    } catch (err) {
      console.error('Error running collection:', err);
      setError('Failed to run data collection');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-disney-tracking">
        <div className="loading">Loading tracking status...</div>
      </div>
    );
  }

  const isRunning = status?.collector?.isRunning === true;

  return (
    <div className="admin-disney-tracking">
      <div className="tracking-header">
        <h2>Disney Wait Time Tracking</h2>
        <p className="tracking-subtitle">
          Collect historical wait time data from all Disney World parks for predictions
        </p>
      </div>

      {error && (
        <div className="tracking-error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Status Section */}
      <div className="tracking-section">
        <h3>Collection Status</h3>
        <div className="status-grid">
          <div className={`status-indicator ${isRunning ? 'running' : 'stopped'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="status-detail">
            <span className="label">Last Collection:</span>
            <span className="value">{formatDate(status?.config?.lastCollectionTime)}</span>
          </div>
          <div className="status-detail">
            <span className="label">Interval:</span>
            <span className="value">Every {status?.config?.collectionIntervalMinutes || 5} minutes</span>
          </div>
          {status?.config?.errorMessage && (
            <div className="status-detail error">
              <span className="label">Error:</span>
              <span className="value">{status.config.errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Section */}
      <div className="tracking-section">
        <h3>Controls</h3>
        <div className="controls-row">
          <div className="interval-control">
            <label htmlFor="interval">Collection Interval (minutes):</label>
            <input
              id="interval"
              type="number"
              min="1"
              max="60"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 5)}
              disabled={isRunning}
            />
          </div>
          <div className="button-group">
            {!isRunning ? (
              <button
                className="btn-start"
                onClick={handleStart}
                disabled={actionLoading}
              >
                {actionLoading ? 'Starting...' : 'Start Collection'}
              </button>
            ) : (
              <button
                className="btn-stop"
                onClick={handleStop}
                disabled={actionLoading}
              >
                {actionLoading ? 'Stopping...' : 'Stop Collection'}
              </button>
            )}
            <button
              className="btn-collect"
              onClick={handleCollectNow}
              disabled={actionLoading}
            >
              {actionLoading ? 'Collecting...' : 'Collect Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="tracking-section">
        <h3>Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{formatNumber(status?.statistics?.totalSnapshots)}</span>
            <span className="stat-label">Total Snapshots</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatNumber(status?.statistics?.snapshotsLast24h)}</span>
            <span className="stat-label">Last 24 Hours</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatNumber(status?.statistics?.totalRides)}</span>
            <span className="stat-label">Rides Tracked</span>
          </div>
        </div>
        <div className="stats-details">
          <div className="stat-detail">
            <span className="label">Oldest Data:</span>
            <span className="value">{formatDate(status?.statistics?.oldestSnapshot)}</span>
          </div>
          <div className="stat-detail">
            <span className="label">Newest Data:</span>
            <span className="value">{formatDate(status?.statistics?.newestSnapshot)}</span>
          </div>
          <div className="stat-detail">
            <span className="label">Data Retention:</span>
            <span className="value">Forever</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="tracking-info">
        <h4>How It Works</h4>
        <ul>
          <li>When enabled, the system collects wait times from all 4 Disney World parks</li>
          <li>Each snapshot includes weather conditions and holiday information for context</li>
          <li>Data is kept forever to enable accurate long-term predictions</li>
          <li>Once enough data is collected, predictions will become available</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminDisneyTracking;
