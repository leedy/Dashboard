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
  const [selectedPark, setSelectedPark] = useState('magic-kingdom');
  const [excludedRides, setExcludedRides] = useState(preferences.disneyExcludedRides || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllRides();
  }, []);

  const fetchAllRides = async () => {
    setLoading(true);
    try {
      const ridesData = {};

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
              });
            }
          });
        }

        ridesData[parkKey] = rides.sort((a, b) => a.name.localeCompare(b.name));
      }

      setAllRides(ridesData);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRideExcluded = (rideId) => {
    return excludedRides.includes(rideId);
  };

  const toggleRide = (rideId) => {
    setExcludedRides(prev => {
      if (prev.includes(rideId)) {
        // Remove from excluded (include in calculation)
        return prev.filter(id => id !== rideId);
      } else {
        // Add to excluded (exclude from calculation)
        return [...prev, rideId];
      }
    });
  };

  const toggleAllInPark = (include) => {
    const parkRides = allRides[selectedPark] || [];
    setExcludedRides(prev => {
      const parkRideIds = parkRides.map(r => r.id);
      if (include) {
        // Remove all park rides from excluded list (include them)
        return prev.filter(id => !parkRideIds.includes(id));
      } else {
        // Add all park rides to excluded list (exclude them)
        const newExcluded = [...prev];
        parkRideIds.forEach(id => {
          if (!newExcluded.includes(id)) {
            newExcluded.push(id);
          }
        });
        return newExcluded;
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedPreferences = {
        ...preferences,
        disneyExcludedRides: excludedRides
      };
      await onSave(updatedPreferences);
    } catch (error) {
      console.error('Error saving ride selections:', error);
    } finally {
      setSaving(false);
    }
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
            </div>
            <div className="bulk-actions">
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

          <div className="ride-selection-actions">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DisneyRideSelection;
