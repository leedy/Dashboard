import { useState, useEffect } from 'react';
import axios from 'axios';
import './DisneyDashboard.css';

// Weights for crowd level calculation - higher weight = more influence on crowd score
const CROWD_WEIGHTS = {
  headliner: 2.0,    // Most influence - these define the park experience
  popular: 1.0,      // Standard weight
  standard: 0.5,     // Less influence
  minor: 0,          // Excluded entirely
  unclassified: 0    // Excluded entirely
};

function DisneyDashboard({ preferences, activePark }) {
  const [selectedPark, setSelectedPark] = useState('magic-kingdom');
  const [waitTimesData, setWaitTimesData] = useState({ lands: [] });
  const [parkHours, setParkHours] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState('by-wait'); // 'by-land' or 'by-wait'
  const [classifications, setClassifications] = useState({}); // rideId -> classification type
  const [dataMode, setDataMode] = useState('live'); // 'live' or 'records'
  const [recordsData, setRecordsData] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Check if using category system
  const useCategorySystem = preferences.disneyDisplayCategories !== null &&
                            preferences.disneyDisplayCategories !== undefined &&
                            Array.isArray(preferences.disneyDisplayCategories);

  // Update selected park when activePark prop changes (during auto-rotation)
  useEffect(() => {
    if (activePark) {
      setSelectedPark(activePark);
    }
  }, [activePark]);

  const parks = {
    'magic-kingdom': {
      id: 6,
      name: 'Magic Kingdom',
      icon: '\u{1F3F0}',
      entityId: '75ea578a-adc8-4116-a54d-dccb60765ef9'
    },
    'epcot': {
      id: 5,
      name: 'Epcot',
      icon: '\u{1F310}',
      entityId: '47f90d2c-e191-4239-a466-5892ef59a88b'
    },
    'hollywood-studios': {
      id: 7,
      name: 'Hollywood Studios',
      icon: '\u{1F3AC}',
      entityId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8'
    },
    'animal-kingdom': {
      id: 8,
      name: 'Animal Kingdom',
      icon: '\u{1F981}',
      entityId: '1c84a229-8862-4648-9c71-378ddd2c7693'
    }
  };

  useEffect(() => {
    fetchWaitTimes();
    fetchParkHours();
  }, [selectedPark]);

  // Fetch classifications once on mount
  useEffect(() => {
    const fetchClassifications = async () => {
      try {
        const response = await axios.get('/api/disney/classifications');
        const classMap = {};
        response.data.rides.forEach(ride => {
          classMap[ride.rideId] = ride.classification?.type || 'unclassified';
        });
        setClassifications(classMap);
      } catch (error) {
        console.error('Error fetching classifications:', error);
      }
    };
    fetchClassifications();
  }, []);

  // Fetch records when in records mode or when park changes while in records mode
  useEffect(() => {
    if (dataMode === 'records') {
      fetchRecords();
    }
  }, [dataMode, selectedPark]);

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

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const parkId = parks[selectedPark].id;
      const response = await axios.get(`/api/disney/tracking/records/${parkId}`);
      setRecordsData(response.data.rides);
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecordsData(null);
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchParkHours = async () => {
    try {
      const entityId = parks[selectedPark].entityId;
      const response = await axios.get(`/api/themeparks/v1/entity/${entityId}/schedule`);

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
  // Note: We primarily rely on the is_open status from the queue-times API
  // The park hours are mainly for display purposes
  const isParkOpen = () => {
    if (!parkHours || !parkHours.openingTime || !parkHours.closingTime) {
      // If we don't have park hours, check if any rides are open
      return waitTimesData.lands?.some(land =>
        land.rides?.some(ride => ride.is_open)
      ) || false;
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

  const formatRecordDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to check if a ride should be included based on filtering mode
  const shouldIncludeRide = (rideId, forCrowdCalc = false) => {
    if (useCategorySystem) {
      const rideClassification = classifications[rideId] || 'unclassified';
      const categories = forCrowdCalc
        ? (preferences.disneyCrowdCategories || ['headliner', 'popular'])
        : (preferences.disneyDisplayCategories || ['headliner', 'popular', 'standard', 'minor', 'unclassified']);
      return categories.includes(rideClassification);
    } else {
      // Legacy: check exclusion list
      const excludedRides = preferences.disneyExcludedRides || [];
      return !excludedRides.includes(rideId);
    }
  };

  // Get all rides flattened and sorted by wait time (longest first)
  const getAllRidesSorted = () => {
    if (!waitTimesData.lands || waitTimesData.lands.length === 0) {
      return [];
    }

    const allRides = [];
    waitTimesData.lands.forEach(land => {
      if (land.rides) {
        land.rides.forEach(ride => {
          if (shouldIncludeRide(ride.id, false)) {
            allRides.push({
              ...ride,
              classification: classifications[ride.id] || 'unclassified'
            });
          }
        });
      }
    });

    // Sort by wait time descending (longest first)
    // Closed rides go to the end
    return allRides.sort((a, b) => {
      const aOpen = a.is_open;
      const bOpen = b.is_open;

      if (!aOpen && !bOpen) return 0;
      if (!aOpen) return 1;
      if (!bOpen) return -1;
      return b.wait_time - a.wait_time;
    });
  };

  // Transform records data into land-grouped structure for By Land view
  const getRecordsAsLands = () => {
    if (!recordsData) return [];

    const landMap = {};
    recordsData.forEach(ride => {
      if (!shouldIncludeRide(ride.rideId, false)) return;
      const landKey = ride.landId || 'unknown';
      if (!landMap[landKey]) {
        landMap[landKey] = {
          id: ride.landId,
          name: ride.landName || 'Unknown Land',
          rides: []
        };
      }
      landMap[landKey].rides.push({
        id: ride.rideId,
        name: ride.rideName,
        wait_time: ride.peakWaitTime || 0,
        is_open: ride.peakWaitTime != null,
        isActive: ride.isActive,
        peakDate: ride.peakWaitTimeDate,
        classification: ride.classification?.type || 'unclassified'
      });
    });

    return Object.values(landMap);
  };

  // Get all records sorted by peak wait time for By Wait Time view
  const getAllRecordsSorted = () => {
    if (!recordsData) return [];

    const rides = recordsData
      .filter(ride => shouldIncludeRide(ride.rideId, false))
      .map(ride => ({
        id: ride.rideId,
        name: ride.rideName,
        wait_time: ride.peakWaitTime || 0,
        is_open: ride.peakWaitTime != null,
        isActive: ride.isActive,
        peakDate: ride.peakWaitTimeDate,
        classification: ride.classification?.type || 'unclassified'
      }));

    return rides.sort((a, b) => {
      // Rides with no data go to the end
      if (!a.is_open && !b.is_open) return 0;
      if (!a.is_open) return 1;
      if (!b.is_open) return -1;
      return b.wait_time - a.wait_time;
    });
  };

  // Calculate current crowd level based on weighted average wait times
  const getCrowdLevel = () => {
    if (!waitTimesData.lands || waitTimesData.lands.length === 0) {
      return null;
    }

    let totalWeightedWait = 0;
    let totalWeight = 0;
    let rideCount = 0;

    waitTimesData.lands.forEach(land => {
      if (land.rides) {
        land.rides.forEach(ride => {
          if (ride.is_open) {
            const classification = classifications[ride.id] || 'unclassified';
            const weight = CROWD_WEIGHTS[classification] || 0;

            if (weight > 0) {
              totalWeightedWait += ride.wait_time * weight;
              totalWeight += weight;
              rideCount++;
            }
          }
        });
      }
    });

    if (totalWeight === 0) {
      return null;
    }

    const weightedAverage = totalWeightedWait / totalWeight;

    // Categorize crowd level
    if (weightedAverage < 20) {
      return { level: 'Low', color: 'low', avgWait: Math.round(weightedAverage), rideCount };
    } else if (weightedAverage < 35) {
      return { level: 'Moderate', color: 'moderate', avgWait: Math.round(weightedAverage), rideCount };
    } else if (weightedAverage < 50) {
      return { level: 'High', color: 'high', avgWait: Math.round(weightedAverage), rideCount };
    } else {
      return { level: 'Very High', color: 'very-high', avgWait: Math.round(weightedAverage), rideCount };
    }
  };

  const crowdLevel = getCrowdLevel();
  const isRecordsMode = dataMode === 'records';
  const isLoading = isRecordsMode ? recordsLoading : loading;

  // Render a ride card (shared between live and records mode)
  const renderRideCard = (ride, rideIsOpen) => {
    const isRetired = isRecordsMode && ride.isActive === false;
    const hasNoData = isRecordsMode && !ride.is_open;

    return (
      <div
        key={ride.id}
        className={`ride-card ${hasNoData ? 'closed' : getWaitTimeClass(ride.wait_time, rideIsOpen)} ${isRetired ? 'retired' : ''}`}
      >
        <div className="ride-info">
          <span className="ride-name">
            {ride.name}
            {isRetired && <span className="retired-badge">RETIRED</span>}
          </span>
          <div className="ride-status">
            {hasNoData ? (
              <span className="status-badge no-data">No Data</span>
            ) : (
              <>
                <div className="wait-time-group">
                  <span className="wait-time">{ride.wait_time} min</span>
                  {isRecordsMode && ride.peakDate && (
                    <span className="record-date">{formatRecordDate(ride.peakDate)}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="disney-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h2>Disney World Wait Times</h2>
            {!isRecordsMode && parkHours && (
              <p className="park-hours">
                {parks[selectedPark].name} Hours: {parkHours.open} - {parkHours.close}
              </p>
            )}
            {!isRecordsMode && !isParkOpen() && parkHours && (
              <div className="park-closed-banner">
                <span className="park-closed-text">{'\u26A0\uFE0F'} PARK CLOSED</span>
              </div>
            )}
            {!isRecordsMode && lastUpdated && (
              <p className="last-updated">Last updated: {formatLastUpdated()}</p>
            )}
            {isRecordsMode && (
              <p className="last-updated">Showing all-time record wait times</p>
            )}
          </div>
        </div>

        <div className="data-mode-toggle">
          <button
            className={`toggle-btn ${dataMode === 'live' ? 'active' : ''}`}
            onClick={() => setDataMode('live')}
          >
            Live
          </button>
          <button
            className={`toggle-btn ${dataMode === 'records' ? 'active' : ''}`}
            onClick={() => setDataMode('records')}
          >
            All-Time Records
          </button>
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

        <div className="park-selector-row">
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
          {!isRecordsMode && crowdLevel && (
            <div className="crowd-level-container">
              <div className={`crowd-level-badge crowd-${crowdLevel.color}`}>
                <span className="crowd-level-label">Current Crowd Level</span>
                <span className="crowd-level-value">{crowdLevel.level}</span>
                <span className="crowd-level-detail">Avg Wait: {crowdLevel.avgWait} min</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <p>Loading {parks[selectedPark].name} {isRecordsMode ? 'records' : 'wait times'}...</p>
        </div>
      ) : isRecordsMode ? (
        // Records mode content
        <div className="dashboard-content">
          {recordsData && recordsData.length > 0 ? (
            viewMode === 'by-land' ? (
              <div className="lands-grid">
                {getRecordsAsLands().map((land) => {
                  if (land.rides.length === 0) return null;
                  return (
                    <div key={land.id} className="land-section">
                      <h3 className="land-name">{land.name}</h3>
                      <div className="rides-list">
                        {land.rides.map((ride) => renderRideCard(ride, ride.is_open))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rides-sorted-grid">
                {getAllRecordsSorted().map((ride) => renderRideCard(ride, ride.is_open))}
              </div>
            )
          ) : (
            <div className="no-data">
              <p>No record data available for this park.</p>
            </div>
          )}
        </div>
      ) : (
        // Live mode content
        <div className="dashboard-content">
          {waitTimesData.lands && waitTimesData.lands.length > 0 ? (
            viewMode === 'by-land' ? (
              // Original view: grouped by land
              <div className="lands-grid">
                {waitTimesData.lands.map((land) => {
                  // Filter to only show included rides based on current filtering mode
                  const includedRides = land.rides ? land.rides.filter(ride => shouldIncludeRide(ride.id, false)) : [];

                  // Only show the land section if it has included rides
                  if (includedRides.length === 0) return null;

                  return (
                    <div key={land.id} className="land-section">
                      <h3 className="land-name">{land.name}</h3>
                      <div className="rides-list">
                        {includedRides.map((ride) => {
                          // Override ride status if park is closed
                          const rideIsOpen = isParkOpen() && ride.is_open;
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
                  const rideIsOpen = isParkOpen() && ride.is_open;
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

      {!isRecordsMode && (
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
      )}

      <div className="info-box">
        <p>
          {isRecordsMode ? (
            <>
              <strong>Note:</strong> Showing the highest recorded wait time for each ride.
              Data collected by the Disney tracking system.
            </>
          ) : (
            <>
              <strong>Note:</strong> Wait times are live from Disney World parks.
              Data powered by <a href="https://queue-times.com" target="_blank" rel="noopener noreferrer">Queue-Times.com</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default DisneyDashboard;
