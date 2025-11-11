import { useState, useEffect } from 'react';
import axios from 'axios';
import './ISSTracker.css';

function ISSTracker() {
  const [issData, setIssData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchISSData();
    // Update every 5 seconds
    const interval = setInterval(fetchISSData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchISSData = async () => {
    try {
      const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544');
      setIssData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching ISS data:', err);
      setError('Failed to load ISS data');
    } finally {
      setLoading(false);
    }
  };

  const getLocationDescription = (lat, lon) => {
    // Simple ocean/continent detection based on coordinates
    // This is a simplified version - you could enhance with reverse geocoding
    const regions = [
      { name: 'Pacific Ocean', latRange: [-60, 60], lonRange: [120, -100] },
      { name: 'Atlantic Ocean', latRange: [-60, 60], lonRange: [-80, 20] },
      { name: 'Indian Ocean', latRange: [-60, 30], lonRange: [40, 120] },
      { name: 'North America', latRange: [15, 75], lonRange: [-170, -50] },
      { name: 'South America', latRange: [-60, 15], lonRange: [-85, -30] },
      { name: 'Europe', latRange: [35, 75], lonRange: [-10, 50] },
      { name: 'Africa', latRange: [-35, 40], lonRange: [-20, 55] },
      { name: 'Asia', latRange: [5, 75], lonRange: [50, 180] },
      { name: 'Australia', latRange: [-45, -10], lonRange: [110, 160] }
    ];

    for (const region of regions) {
      if (lat >= region.latRange[0] && lat <= region.latRange[1]) {
        if (region.lonRange[0] < region.lonRange[1]) {
          if (lon >= region.lonRange[0] && lon <= region.lonRange[1]) {
            return region.name;
          }
        } else {
          // Handle longitude wrap-around
          if (lon >= region.lonRange[0] || lon <= region.lonRange[1]) {
            return region.name;
          }
        }
      }
    }
    return 'Earth';
  };

  const formatCoordinate = (value, isLatitude) => {
    const direction = isLatitude
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(2)}° ${direction}`;
  };

  if (loading) {
    return (
      <div className="iss-tracker">
        <div className="loading-container">
          <p>Loading ISS position...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="iss-tracker">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const location = getLocationDescription(issData.latitude, issData.longitude);

  return (
    <div className="iss-tracker">
      <div className="iss-header">
        <h1 className="iss-title">🛰️ International Space Station</h1>
        <p className="iss-subtitle">Real-time tracking • Updates every 5 seconds</p>
      </div>

      <div className="iss-content">
        {/* Main ISS Card */}
        <div className="iss-main-card">
          <div className="iss-icon">🌍</div>
          <div className="iss-location-info">
            <h2>Current Position</h2>
            <p className="location-name">{location}</p>
            <div className="coordinates">
              <span>{formatCoordinate(issData.latitude, true)}</span>
              <span className="coord-separator">•</span>
              <span>{formatCoordinate(issData.longitude, false)}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="iss-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📏</div>
            <div className="stat-content">
              <h3>Altitude</h3>
              <p className="stat-value">{Math.round(issData.altitude)} km</p>
              <p className="stat-detail">{Math.round(issData.altitude * 0.621371)} miles</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>Velocity</h3>
              <p className="stat-value">{Math.round(issData.velocity)} km/h</p>
              <p className="stat-detail">{Math.round(issData.velocity * 0.621371)} mph</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">{issData.visibility === 'daylight' ? '☀️' : '🌙'}</div>
            <div className="stat-content">
              <h3>Visibility</h3>
              <p className="stat-value">{issData.visibility === 'daylight' ? 'Daylight' : 'Eclipse'}</p>
              <p className="stat-detail">{issData.visibility === 'daylight' ? 'Solar panels active' : 'In Earth\'s shadow'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-content">
              <h3>Timestamp</h3>
              <p className="stat-value">{new Date(issData.timestamp * 1000).toLocaleTimeString()}</p>
              <p className="stat-detail">{new Date(issData.timestamp * 1000).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="iss-info-card">
          <h3>📡 About the ISS</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Orbit Time:</span>
              <span className="info-value">~90 minutes</span>
            </div>
            <div className="info-item">
              <span className="info-label">Speed:</span>
              <span className="info-value">~28,000 km/h</span>
            </div>
            <div className="info-item">
              <span className="info-label">Launched:</span>
              <span className="info-value">November 20, 1998</span>
            </div>
            <div className="info-item">
              <span className="info-label">Size:</span>
              <span className="info-value">109m × 73m</span>
            </div>
            <div className="info-item">
              <span className="info-label">Mass:</span>
              <span className="info-value">~420,000 kg</span>
            </div>
            <div className="info-item">
              <span className="info-label">Crew Capacity:</span>
              <span className="info-value">Up to 7 astronauts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ISSTracker;
