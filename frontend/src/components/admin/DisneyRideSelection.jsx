import { useState, useEffect } from 'react';
import axios from 'axios';
import './DisneyRideSelection.css';

const PARKS = {
  'magic-kingdom': { id: 6, name: 'Magic Kingdom', icon: '🏰' },
  'epcot': { id: 5, name: 'Epcot', icon: '🌐' },
  'hollywood-studios': { id: 7, name: 'Hollywood Studios', icon: '🎬' },
  'animal-kingdom': { id: 8, name: 'Animal Kingdom', icon: '🦁' }
};

function DisneyRideSelection({ preferences, onSave }) {
  const [allRides, setAllRides] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPark, setSelectedPark] = useState('magic-kingdom');
  const [excludedRides, setExcludedRides] = useState(preferences.disneyExcludedRides || []);
  const [knownRides, setKnownRides] = useState(preferences.disneyKnownRides || []);
  const [saveMessage, setSaveMessage] = useState(null);
  const [newRidesDetected, setNewRidesDetected] = useState(0);

  useEffect(() => {
    fetchAllRides();
  }, []);

  // Sync excludedRides and knownRides with preferences when they change
  useEffect(() => {
    setExcludedRides(preferences.disneyExcludedRides || []);
    setKnownRides(preferences.disneyKnownRides || []);
  }, [preferences]);

  const fetchAllRides = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const ridesData = {};
      const allCurrentRideIds = [];

      for (const [parkKey, park] of Object.entries(PARKS)) {
        const response = await axios.get(`/api/queue-times/parks/${park.id}/queue_times.json`);

        // Flatten all rides from all lands
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
                allCurrentRideIds.push(ride.id);
              });
            }
          });
        }

        ridesData[parkKey] = rides.sort((a, b) => a.name.localeCompare(b.name));
      }

      setAllRides(ridesData);

      // Detect new rides (rides in API but not in knownRides)
      const newRides = allCurrentRideIds.filter(id => !knownRides.includes(id));

      if (newRides.length > 0) {
        setNewRidesDetected(newRides.length);

        // Auto-exclude new rides and update known rides
        const updatedExcluded = [...new Set([...excludedRides, ...newRides])];
        const updatedKnown = [...new Set([...knownRides, ...allCurrentRideIds])];

        setExcludedRides(updatedExcluded);
        setKnownRides(updatedKnown);

        // Auto-save the updated preferences
        const updatedPreferences = {
          ...preferences,
          disneyExcludedRides: updatedExcluded,
          disneyKnownRides: updatedKnown
        };

        await onSave(updatedPreferences);

        setSaveMessage({
          type: 'success',
          text: `Found ${newRides.length} new attraction(s) - automatically excluded from crowd calculations`
        });
        setTimeout(() => {
          setSaveMessage(null);
          setNewRidesDetected(0);
        }, 5000);
      } else if (isRefresh) {
        // Just update known rides to include current state
        const updatedKnown = [...new Set([...knownRides, ...allCurrentRideIds])];
        if (updatedKnown.length !== knownRides.length) {
          setKnownRides(updatedKnown);
          await onSave({
            ...preferences,
            disneyKnownRides: updatedKnown
          });
        }

        setSaveMessage({ type: 'success', text: 'Attraction list refreshed - no new attractions found' });
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

  const isRideExcluded = (rideId) => {
    return excludedRides.includes(rideId);
  };

  const toggleRide = async (rideId) => {
    const updatedExcluded = excludedRides.includes(rideId)
      ? excludedRides.filter(id => id !== rideId)
      : [...excludedRides, rideId];

    setExcludedRides(updatedExcluded);

    // Auto-save
    const updatedPreferences = {
      ...preferences,
      disneyExcludedRides: updatedExcluded,
      disneyKnownRides: knownRides
    };
    await onSave(updatedPreferences);
  };

  const toggleAllInPark = async (include) => {
    const parkRides = allRides[selectedPark] || [];
    const parkRideIds = parkRides.map(r => r.id);

    let updatedExcluded;
    if (include) {
      // Remove all park rides from excluded list (include them)
      updatedExcluded = excludedRides.filter(id => !parkRideIds.includes(id));
    } else {
      // Add all park rides to excluded list (exclude them)
      updatedExcluded = [...excludedRides];
      parkRideIds.forEach(id => {
        if (!updatedExcluded.includes(id)) {
          updatedExcluded.push(id);
        }
      });
    }

    setExcludedRides(updatedExcluded);

    // Auto-save
    const updatedPreferences = {
      ...preferences,
      disneyExcludedRides: updatedExcluded,
      disneyKnownRides: knownRides
    };
    await onSave(updatedPreferences);
  };


  const handleRefresh = async () => {
    await fetchAllRides(true);
  };

  const currentParkRides = allRides[selectedPark] || [];
  const includedCount = currentParkRides.filter(r => !isRideExcluded(r.id)).length;
  const totalCount = currentParkRides.length;

  return (
    <div className="disney-ride-selection">
      <div className="ride-selection-header">
        <h2>Disney Crowd Calculation Settings</h2>
        <p>Select which attractions should be included in the crowd level calculation</p>
      </div>

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
              {includedCount} of {totalCount} attractions included
              {newRidesDetected > 0 && (
                <span className="new-rides-badge">+{newRidesDetected} new</span>
              )}
            </div>
            <div className="bulk-actions">
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
                onClick={() => toggleRide(ride.id)}
              >
                <div className="ride-selection-checkbox">
                  <input
                    type="checkbox"
                    checked={!isRideExcluded(ride.id)}
                    onChange={() => toggleRide(ride.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="ride-selection-info">
                  <div className="ride-selection-name">{ride.name}</div>
                  <div className="ride-selection-land">{ride.landName}</div>
                </div>
                <div className="ride-selection-status">
                  {isRideExcluded(ride.id) ? (
                    <span className="status-excluded">Excluded</span>
                  ) : (
                    <span className="status-included">Included</span>
                  )}
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

export default DisneyRideSelection;
