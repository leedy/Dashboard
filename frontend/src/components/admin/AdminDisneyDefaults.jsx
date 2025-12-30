import { useState, useEffect } from 'react';
import axios from 'axios';
import './DisneyRideSelection.css';

const PARKS = {
  'magic-kingdom': { id: 6, name: 'Magic Kingdom', icon: '🏰' },
  'epcot': { id: 5, name: 'Epcot', icon: '🌐' },
  'hollywood-studios': { id: 7, name: 'Hollywood Studios', icon: '🎬' },
  'animal-kingdom': { id: 8, name: 'Animal Kingdom', icon: '🦁' }
};

const CLASSIFICATION_OPTIONS = [
  { value: 'headliner', label: 'Headliner', color: '#e74c3c' },
  { value: 'popular', label: 'Popular', color: '#f39c12' },
  { value: 'standard', label: 'Standard', color: '#3498db' },
  { value: 'minor', label: 'Minor', color: '#95a5a6' },
  { value: 'unclassified', label: 'Unclassified', color: '#bdc3c7' }
];

function AdminDisneyDefaults() {
  const [allRides, setAllRides] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedPark, setSelectedPark] = useState('magic-kingdom');
  const [excludedRides, setExcludedRides] = useState([]);
  const [knownRides, setKnownRides] = useState([]);
  const [classifications, setClassifications] = useState({});
  const [classificationStats, setClassificationStats] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    loadDefaultPreferences();
    fetchAllRides();
    fetchClassifications();
  }, []);

  const loadDefaultPreferences = async () => {
    try {
      const response = await axios.get('/api/preferences?userId=default-user');
      setExcludedRides(response.data.disneyExcludedRides || []);
      setKnownRides(response.data.disneyKnownRides || []);
    } catch (error) {
      console.error('Error loading default preferences:', error);
    }
  };

  const fetchClassifications = async () => {
    try {
      const [ridesResponse, statsResponse] = await Promise.all([
        axios.get('/api/disney/classifications'),
        axios.get('/api/disney/classifications/stats')
      ]);

      const classMap = {};
      ridesResponse.data.rides.forEach(ride => {
        classMap[ride.rideId] = ride.classification?.type || 'unclassified';
      });
      setClassifications(classMap);
      setClassificationStats(statsResponse.data.stats);
    } catch (error) {
      console.error('Error fetching classifications:', error);
    }
  };

  const fetchAllRides = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const ridesData = {};

      for (const [parkKey, park] of Object.entries(PARKS)) {
        const response = await axios.get(`/api/queue-times/parks/${park.id}/queue_times.json`);

        const rides = [];
        if (response.data.lands) {
          response.data.lands.forEach(land => {
            if (land.rides) {
              land.rides.forEach(ride => {
                rides.push({
                  ...ride,
                  landName: land.name,
                  parkKey: parkKey
                });
              });
            }
          });
        }

        ridesData[parkKey] = rides.sort((a, b) => a.name.localeCompare(b.name));
      }

      setAllRides(ridesData);

      if (isRefresh) {
        setSaveMessage({ type: 'success', text: 'Attraction list refreshed successfully' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      setSaveMessage({ type: 'error', text: 'Failed to fetch attractions. Please try again.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSyncRides = async () => {
    setSyncing(true);
    try {
      const response = await axios.post('/api/disney/classifications/sync');
      await fetchClassifications();
      setSaveMessage({
        type: 'success',
        text: `Sync complete! ${response.data.created} new rides, ${response.data.updated} updated.`
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error syncing rides:', error);
      setSaveMessage({ type: 'error', text: 'Failed to sync rides' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleClassificationChange = async (rideId, classification) => {
    try {
      await axios.put(`/api/disney/classifications/${rideId}`, { classification });
      setClassifications(prev => ({ ...prev, [rideId]: classification }));

      // Update stats
      const statsResponse = await axios.get('/api/disney/classifications/stats');
      setClassificationStats(statsResponse.data.stats);

      setSaveMessage({ type: 'success', text: 'Classification updated' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Error updating classification:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update classification' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const saveDefaults = async (updatedExcluded, updatedKnown) => {
    try {
      await axios.put('/api/preferences?userId=default-user', {
        disneyExcludedRides: updatedExcluded,
        disneyKnownRides: updatedKnown
      });

      setSaveMessage({ type: 'success', text: 'Default settings saved' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving defaults:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save defaults' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const isRideExcluded = (rideId) => {
    return excludedRides.includes(rideId);
  };

  const toggleRide = async (rideId) => {
    const updatedExcluded = excludedRides.includes(rideId)
      ? excludedRides.filter(id => id !== rideId)
      : [...excludedRides, rideId];

    setExcludedRides(updatedExcluded);
    await saveDefaults(updatedExcluded, knownRides);
  };

  const toggleAllInPark = async (include) => {
    const parkRides = allRides[selectedPark] || [];
    const parkRideIds = parkRides.map(r => r.id);

    let updatedExcluded;
    if (include) {
      updatedExcluded = excludedRides.filter(id => !parkRideIds.includes(id));
    } else {
      updatedExcluded = [...excludedRides];
      parkRideIds.forEach(id => {
        if (!updatedExcluded.includes(id)) {
          updatedExcluded.push(id);
        }
      });
    }

    setExcludedRides(updatedExcluded);
    await saveDefaults(updatedExcluded, knownRides);
  };

  const handleRefresh = async () => {
    await fetchAllRides(true);
  };

  const getClassificationColor = (classification) => {
    const option = CLASSIFICATION_OPTIONS.find(o => o.value === classification);
    return option ? option.color : '#bdc3c7';
  };

  const currentParkRides = allRides[selectedPark] || [];
  const includedCount = currentParkRides.filter(r => !isRideExcluded(r.id)).length;
  const totalCount = currentParkRides.length;

  return (
    <div className="disney-ride-selection">
      <div className="ride-selection-header">
        <h2>Disney Ride Classifications & Defaults</h2>
        <p>Classify rides and configure default settings for new users.</p>
      </div>

      {/* Classification Stats */}
      {classificationStats && (
        <div className="classification-stats">
          {CLASSIFICATION_OPTIONS.map(opt => (
            <div
              key={opt.value}
              className="stat-badge"
              style={{ backgroundColor: opt.color }}
            >
              <span className="stat-count">{classificationStats[opt.value] || 0}</span>
              <span className="stat-label">{opt.label}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-message">Loading attractions from all parks...</div>
      ) : (
        <>
          <div className="park-selector">
            {Object.entries(PARKS).map(([key, park]) => (
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

          <div className="ride-selection-controls">
            <div className="selection-stats">
              {includedCount} of {totalCount} attractions included by default
            </div>
            <div className="bulk-actions">
              <button
                className="sync-btn"
                onClick={handleSyncRides}
                disabled={syncing}
                title="Sync rides to database for classification"
              >
                {syncing ? '⏳ Syncing...' : '📥 Sync to DB'}
              </button>
              <button
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh attraction list from Disney API"
              >
                {refreshing ? '🔄 Refreshing...' : '🔄 Refresh List'}
              </button>
              <button className="bulk-btn" onClick={() => toggleAllInPark(true)}>
                Include All
              </button>
              <button className="bulk-btn" onClick={() => toggleAllInPark(false)}>
                Exclude All
              </button>
            </div>
          </div>

          <div className="rides-selection-list">
            {currentParkRides.map(ride => (
              <div
                key={ride.id}
                className={`ride-selection-item ${isRideExcluded(ride.id) ? 'excluded' : 'included'}`}
              >
                <div className="ride-selection-checkbox" onClick={() => toggleRide(ride.id)}>
                  <input
                    type="checkbox"
                    checked={!isRideExcluded(ride.id)}
                    onChange={() => toggleRide(ride.id)}
                  />
                </div>
                <div className="ride-selection-info" onClick={() => toggleRide(ride.id)}>
                  <div className="ride-selection-name">{ride.name}</div>
                  <div className="ride-selection-land">{ride.landName}</div>
                </div>
                <div className="ride-classification">
                  <select
                    className="classification-select"
                    value={classifications[ride.id] || 'unclassified'}
                    onChange={(e) => handleClassificationChange(ride.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderColor: getClassificationColor(classifications[ride.id] || 'unclassified') }}
                  >
                    {CLASSIFICATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {saveMessage && (
            <div className={`save-message ${saveMessage.type}`} style={{ marginTop: '1rem', textAlign: 'center' }}>
              {saveMessage.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDisneyDefaults;
