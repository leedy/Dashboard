import { useState, useEffect } from 'react';
import axios from 'axios';
import './DisneyDashboard.css';

function DisneyDashboard({ preferences }) {
  const [selectedPark, setSelectedPark] = useState('magic-kingdom');
  const [waitTimesData, setWaitTimesData] = useState({ lands: [] });
  const [parkHours, setParkHours] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('by-land'); // 'by-land' or 'by-wait'

  const parks = {
    'magic-kingdom': {
      id: 6,
      name: 'Magic Kingdom',
      icon: '🏰',
      entityId: '75ea578a-adc8-4116-a54d-dccb60765ef9'
    },
    'epcot': {
      id: 5,
      name: 'Epcot',
      icon: '🌐',
      entityId: '47f90d2c-e191-4239-a466-5892ef59a88b'
    },
    'hollywood-studios': {
      id: 7,
      name: 'Hollywood Studios',
      icon: '🎬',
      entityId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8'
    },
    'animal-kingdom': {
      id: 8,
      name: 'Animal Kingdom',
      icon: '🦁',
      entityId: '1c84a229-8862-4648-9c71-378ddd2c7693'
    }
  };

  useEffect(() => {
    fetchWaitTimes();
    fetchParkHours();
  }, [selectedPark]);

  const fetchWaitTimes = async () => {
    setLoading(true);
    try {
      const parkId = parks[selectedPark].id;
      const response = await axios.get(`/api/queue-times/parks/${parkId}/queue_times.json`);

      setWaitTimesData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching wait times:', error);
      setWaitTimesData({ lands: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchParkHours = async () => {
    try {
      const entityId = parks[selectedPark].entityId;
      const response = await axios.get(`https://api.themeparks.wiki/v1/entity/${entityId}/schedule`);

      // Get today's date in YYYY-MM-DD format (local time)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      // Find ALL schedule entries for today (including special events)
      const todaySchedules = response.data.schedule.filter(
        entry => entry.date === todayStr && (entry.type === 'OPERATING' || entry.type === 'TICKETED_EVENT')
      );

      if (todaySchedules.length > 0) {
        // Get the earliest opening and latest closing across all entries
        const openingTimes = todaySchedules
          .filter(s => s.openingTime)
          .map(s => new Date(s.openingTime));
        const closingTimes = todaySchedules
          .filter(s => s.closingTime)
          .map(s => new Date(s.closingTime));

        const earliestOpening = new Date(Math.min(...openingTimes));
        const latestClosing = new Date(Math.max(...closingTimes));

        setParkHours({
          open: earliestOpening.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          close: latestClosing.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          openingTime: earliestOpening,
          closingTime: latestClosing
        });
      } else {
        setParkHours(null);
      }
    } catch (error) {
      console.error('Error fetching park hours:', error);
      setParkHours(null);
    }
  };

  // Check if the park is currently open
  const isParkOpen = () => {
    if (!parkHours || !parkHours.openingTime || !parkHours.closingTime) {
      return false;
    }

    const now = new Date();
    return now >= parkHours.openingTime && now <= parkHours.closingTime;
  };

  const getWaitTimeClass = (waitTime, isOpen) => {
    if (!isOpen) return 'closed';
    if (waitTime === 0) return 'no-wait';
    if (waitTime <= 15) return 'short-wait';
    if (waitTime <= 30) return 'moderate-wait';
    if (waitTime <= 60) return 'long-wait';
    return 'very-long-wait';
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Get all rides flattened and sorted by wait time (longest first)
  const getAllRidesSorted = () => {
    if (!waitTimesData.lands || waitTimesData.lands.length === 0) {
      return [];
    }

    const parkOpen = isParkOpen();
    const allRides = [];
    waitTimesData.lands.forEach(land => {
      if (land.rides) {
        land.rides.forEach(ride => {
          allRides.push(ride);
        });
      }
    });

    // Sort by wait time descending (longest first)
    // Closed rides go to the end
    return allRides.sort((a, b) => {
      // If park is closed, all rides are considered closed
      const aOpen = parkOpen && a.is_open;
      const bOpen = parkOpen && b.is_open;

      if (!aOpen && !bOpen) return 0;
      if (!aOpen) return 1;
      if (!bOpen) return -1;
      return b.wait_time - a.wait_time;
    });
  };

  // Calculate current crowd level based on average wait times
  const getCrowdLevel = () => {
    // If park is closed, don't show crowd level
    if (!isParkOpen()) {
      return null;
    }

    if (!waitTimesData.lands || waitTimesData.lands.length === 0) {
      return null;
    }

    const openRides = [];
    waitTimesData.lands.forEach(land => {
      if (land.rides) {
        land.rides.forEach(ride => {
          if (ride.is_open) {
            openRides.push(ride);
          }
        });
      }
    });

    if (openRides.length === 0) {
      return null;
    }

    // Calculate average wait time
    const totalWaitTime = openRides.reduce((sum, ride) => sum + ride.wait_time, 0);
    const averageWaitTime = totalWaitTime / openRides.length;

    // Categorize crowd level
    if (averageWaitTime < 20) {
      return { level: 'Low', color: 'low', avgWait: Math.round(averageWaitTime) };
    } else if (averageWaitTime < 35) {
      return { level: 'Moderate', color: 'moderate', avgWait: Math.round(averageWaitTime) };
    } else if (averageWaitTime < 50) {
      return { level: 'High', color: 'high', avgWait: Math.round(averageWaitTime) };
    } else {
      return { level: 'Very High', color: 'very-high', avgWait: Math.round(averageWaitTime) };
    }
  };

  const crowdLevel = getCrowdLevel();

  return (
    <div className="disney-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h2>Disney World Wait Times</h2>
            {parkHours && (
              <p className="park-hours">
                {parks[selectedPark].name} Hours: {parkHours.open} - {parkHours.close}
              </p>
            )}
            {!isParkOpen() && parkHours && (
              <div className="park-closed-banner">
                <span className="park-closed-text">⚠️ PARK CLOSED</span>
              </div>
            )}
            {lastUpdated && (
              <p className="last-updated">Last updated: {formatLastUpdated()}</p>
            )}
          </div>
          {crowdLevel && (
            <div className="crowd-level-container">
              <div className={`crowd-level-badge crowd-${crowdLevel.color}`}>
                <span className="crowd-level-label">Current Crowd Level</span>
                <span className="crowd-level-value">{crowdLevel.level}</span>
                <span className="crowd-level-detail">Avg Wait: {crowdLevel.avgWait} min</span>
              </div>
            </div>
          )}
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'by-land' ? 'active' : ''}`}
            onClick={() => setViewMode('by-land')}
          >
            By Land
          </button>
          <button
            className={`toggle-btn ${viewMode === 'by-wait' ? 'active' : ''}`}
            onClick={() => setViewMode('by-wait')}
          >
            By Wait Time
          </button>
        </div>

        <div className="park-selector">
          {Object.entries(parks).map(([key, park]) => (
            <button
              key={key}
              className={`park-btn ${selectedPark === key ? 'active' : ''}`}
              onClick={() => setSelectedPark(key)}
            >
              <span className="park-icon">{park.icon}</span>
              <span className="park-name">{park.name}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading {parks[selectedPark].name} wait times...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {waitTimesData.lands && waitTimesData.lands.length > 0 ? (
            viewMode === 'by-land' ? (
              // Original view: grouped by land
              <div className="lands-grid">
                {waitTimesData.lands.map((land) => {
                  const parkOpen = isParkOpen();
                  return (
                    <div key={land.id} className="land-section">
                      <h3 className="land-name">{land.name}</h3>
                      <div className="rides-list">
                        {land.rides && land.rides.map((ride) => {
                          const rideIsOpen = parkOpen && ride.is_open;
                          return (
                            <div
                              key={ride.id}
                              className={`ride-card ${getWaitTimeClass(ride.wait_time, rideIsOpen)}`}
                            >
                              <div className="ride-info">
                                <span className="ride-name">{ride.name}</span>
                                <div className="ride-status">
                                  {!rideIsOpen ? (
                                    <span className="status-badge closed">CLOSED</span>
                                  ) : ride.wait_time === 0 ? (
                                    <span className="wait-time no-wait">Walk On</span>
                                  ) : (
                                    <span className="wait-time">{ride.wait_time} min</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // New view: sorted by wait time in two columns
              <div className="rides-sorted-grid">
                {getAllRidesSorted().map((ride) => {
                  const parkOpen = isParkOpen();
                  const rideIsOpen = parkOpen && ride.is_open;
                  return (
                    <div
                      key={ride.id}
                      className={`ride-card ${getWaitTimeClass(ride.wait_time, rideIsOpen)}`}
                    >
                      <div className="ride-info">
                        <span className="ride-name">{ride.name}</span>
                        <div className="ride-status">
                          {!rideIsOpen ? (
                            <span className="status-badge closed">CLOSED</span>
                          ) : ride.wait_time === 0 ? (
                            <span className="wait-time no-wait">Walk On</span>
                          ) : (
                            <span className="wait-time">{ride.wait_time} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="no-data">
              <p>No wait time data available for this park.</p>
            </div>
          )}
        </div>
      )}

      <div className="crowd-level-legend">
        <h4>Crowd Level Guide</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-badge crowd-low">Low</span>
            <span className="legend-text">Average wait under 20 minutes</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge crowd-moderate">Moderate</span>
            <span className="legend-text">Average wait 20-35 minutes</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge crowd-high">High</span>
            <span className="legend-text">Average wait 35-50 minutes</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge crowd-very-high">Very High</span>
            <span className="legend-text">Average wait over 50 minutes</span>
          </div>
        </div>
      </div>

      <div className="info-box">
        <p>
          <strong>Note:</strong> Wait times are live from Disney World parks.
          Data powered by <a href="https://queue-times.com" target="_blank" rel="noopener noreferrer">Queue-Times.com</a>
        </p>
      </div>
    </div>
  );
}

export default DisneyDashboard;
