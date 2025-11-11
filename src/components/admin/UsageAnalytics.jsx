import { useState, useEffect } from 'react';
import axios from 'axios';
import './UsageAnalytics.css';

function UsageAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [dashboardStats, setDashboardStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // days
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, dashboardRes, sessionsRes, recentRes] = await Promise.all([
        axios.get(`/api/usage/analytics/overview?days=${timeRange}`),
        axios.get(`/api/usage/analytics/dashboards?days=${timeRange}`),
        axios.get(`/api/usage/analytics/sessions?days=${timeRange}`),
        axios.get('/api/usage/analytics/recent?limit=50')
      ]);

      setAnalytics(overviewRes.data);
      setDashboardStats(dashboardRes.data);
      setSessions(sessionsRes.data);
      setRecentActivity(recentRes.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDashboardName = (id) => {
    const names = {
      'todays-games': "Today's Games",
      'upcoming-games': 'Upcoming Games',
      'standings': 'Standings',
      'weather': 'Weather',
      'car-wash': "Bob's Car Wash",
      'stocks': 'Market Overview',
      'countdown': 'Countdown',
      'disney': 'Disney',
      'movies': 'Movies',
      'family-photos': 'Family Photos',
      'event-slides': 'Event Slides',
      'admin': 'Admin Panel'
    };
    return names[id] || id;
  };

  if (loading && !analytics) {
    return (
      <div className="usage-analytics">
        <div className="loading-state">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usage-analytics">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="usage-analytics">
      <div className="analytics-header">
        <h2>Usage Analytics</h2>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(Number(e.target.value))}>
            <option value={1}>Last 24 Hours</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'dashboards' ? 'active' : ''}
          onClick={() => setActiveTab('dashboards')}
        >
          Dashboards
        </button>
        <button
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Recent Activity
        </button>
      </div>

      {activeTab === 'overview' && analytics && (
        <div className="analytics-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.totalEvents.toLocaleString()}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.uniqueSessions}</div>
              <div className="stat-label">Unique Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(analytics.totalEvents / analytics.uniqueSessions).toFixed(1)}
              </div>
              <div className="stat-label">Events per Session</div>
            </div>
          </div>

          <div className="chart-section">
            <h3>Daily Activity</h3>
            <div className="daily-chart">
              {analytics.dailyActivity?.map((day) => (
                <div key={day._id} className="daily-bar">
                  <div
                    className="bar"
                    style={{
                      height: `${(day.events / Math.max(...analytics.dailyActivity.map(d => d.events))) * 100}%`
                    }}
                    title={`${day.events} events`}
                  ></div>
                  <div className="bar-label">{new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <h3>Peak Usage Hours</h3>
            <div className="hourly-chart">
              {analytics.peakHours?.map((hour) => (
                <div key={hour._id} className="hour-bar">
                  <div
                    className="bar"
                    style={{
                      height: `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`
                    }}
                    title={`${hour.count} events`}
                  ></div>
                  <div className="bar-label">{hour._id}:00</div>
                </div>
              ))}
            </div>
          </div>

          <div className="events-breakdown">
            <h3>Events by Type</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {analytics.eventsByType?.map((event) => (
                  <tr key={event._id}>
                    <td>{event._id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td>{event.count.toLocaleString()}</td>
                    <td>{((event.count / analytics.totalEvents) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dashboards' && (
        <div className="analytics-content">
          <h3>Dashboard Statistics</h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Dashboard</th>
                <th>Views</th>
                <th>Unique Visitors</th>
                <th>Avg Duration</th>
                <th>Total Time</th>
              </tr>
            </thead>
            <tbody>
              {dashboardStats.map((dash) => (
                <tr key={dash._id}>
                  <td>{getDashboardName(dash._id)}</td>
                  <td>{dash.views.toLocaleString()}</td>
                  <td>{dash.uniqueVisitors}</td>
                  <td>{formatDuration(dash.avgDuration)}</td>
                  <td>{formatDuration(dash.totalDuration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="analytics-content">
          <h3>User Sessions</h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th>Events</th>
                <th>Dashboards Visited</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session._id}>
                  <td className="monospace">{session._id.substring(0, 20)}...</td>
                  <td>{formatDate(session.firstSeen)}</td>
                  <td>{formatDate(session.lastSeen)}</td>
                  <td>{session.eventCount}</td>
                  <td>{session.dashboards.filter(Boolean).length}</td>
                  <td className="monospace">{session.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="analytics-content">
          <h3>Recent Activity</h3>
          <div className="activity-log">
            {recentActivity.map((event, index) => (
              <div key={event._id || index} className="activity-item">
                <div className="activity-time">{formatDate(event.timestamp)}</div>
                <div className="activity-details">
                  <span className="activity-type">{event.eventType.replace(/_/g, ' ')}</span>
                  {event.dashboardId && (
                    <span className="activity-dashboard"> → {getDashboardName(event.dashboardId)}</span>
                  )}
                  {event.featureName && (
                    <span className="activity-feature"> → {event.featureName}</span>
                  )}
                  {event.duration && (
                    <span className="activity-duration"> ({formatDuration(event.duration)})</span>
                  )}
                </div>
                <div className="activity-session">Session: {event.sessionId.substring(0, 15)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageAnalytics;
