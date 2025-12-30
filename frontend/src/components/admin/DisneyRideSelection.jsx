import { useState, useEffect } from 'react';
import axios from 'axios';
import './DisneyRideSelection.css';

const PARKS = {
  'magic-kingdom': { id: 6, name: 'Magic Kingdom', icon: '🏰' },
  'epcot': { id: 5, name: 'Epcot', icon: '🌐' },
  'hollywood-studios': { id: 7, name: 'Hollywood Studios', icon: '🎬' },
  'animal-kingdom': { id: 8, name: 'Animal Kingdom', icon: '🦁' }
};

const CATEGORIES = [
  { value: 'headliner', label: 'Headliners', color: '#e74c3c', description: 'E-ticket attractions with longest waits' },
  { value: 'popular', label: 'Popular', color: '#f39c12', description: 'Well-known attractions with moderate waits' },
  { value: 'standard', label: 'Standard', color: '#3498db', description: 'Regular attractions' },
  { value: 'minor', label: 'Minor', color: '#95a5a6', description: 'Shows, walk-throughs, low-wait experiences' },
  { value: 'unclassified', label: 'Unclassified', color: '#bdc3c7', description: 'Not yet categorized' }
];

const DEFAULT_DISPLAY_CATEGORIES = ['headliner', 'popular', 'standard', 'minor', 'unclassified'];
const DEFAULT_CROWD_CATEGORIES = ['headliner', 'popular'];

function DisneyRideSelection({ preferences, onSave }) {
  // Determine if using new category system or legacy
  const useCategorySystem = preferences.disneyDisplayCategories !== null &&
                            preferences.disneyDisplayCategories !== undefined;

  const [displayCategories, setDisplayCategories] = useState(
    preferences.disneyDisplayCategories || DEFAULT_DISPLAY_CATEGORIES
  );
  const [crowdCategories, setCrowdCategories] = useState(
    preferences.disneyCrowdCategories || DEFAULT_CROWD_CATEGORIES
  );
  const [classificationStats, setClassificationStats] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [showLegacy, setShowLegacy] = useState(!useCategorySystem);

  // Legacy state (for backward compatibility)
  const [allRides, setAllRides] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPark, setSelectedPark] = useState('magic-kingdom');
  const [excludedRides, setExcludedRides] = useState(preferences.disneyExcludedRides || []);
  const [knownRides, setKnownRides] = useState(preferences.disneyKnownRides || []);

  useEffect(() => {
    fetchClassificationStats();
    if (showLegacy) {
      fetchAllRides();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setExcludedRides(preferences.disneyExcludedRides || []);
    setKnownRides(preferences.disneyKnownRides || []);
    setDisplayCategories(preferences.disneyDisplayCategories || DEFAULT_DISPLAY_CATEGORIES);
    setCrowdCategories(preferences.disneyCrowdCategories || DEFAULT_CROWD_CATEGORIES);
  }, [preferences]);

  const fetchClassificationStats = async () => {
    try {
      const response = await axios.get('/api/disney/classifications/stats');
      setClassificationStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching classification stats:', error);
    }
  };

  const fetchAllRides = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const ridesData = {};
      const allCurrentRideIds = [];

      for (const [parkKey, park] of Object.entries(PARKS)) {
        const response = await axios.get(`/api/queue-times/parks/${park.id}/queue_times.json`);
        const rides = [];
        if (response.data.lands) {
          response.data.lands.forEach(land => {
            if (land.rides) {
              land.rides.forEach(ride => {
                rides.push({ ...ride, landName: land.name, parkKey });
                allCurrentRideIds.push(ride.id);
              });
            }
          });
        }
        ridesData[parkKey] = rides.sort((a, b) => a.name.localeCompare(b.name));
      }

      setAllRides(ridesData);

      if (isRefresh) {
        setSaveMessage({ type: 'success', text: 'Attraction list refreshed' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      setSaveMessage({ type: 'error', text: 'Failed to fetch attractions' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Category system handlers
  const toggleDisplayCategory = async (category) => {
    const updated = displayCategories.includes(category)
      ? displayCategories.filter(c => c !== category)
      : [...displayCategories, category];
    setDisplayCategories(updated);
    await saveCategories(updated, crowdCategories);
  };

  const toggleCrowdCategory = async (category) => {
    const updated = crowdCategories.includes(category)
      ? crowdCategories.filter(c => c !== category)
      : [...crowdCategories, category];
    setCrowdCategories(updated);
    await saveCategories(displayCategories, updated);
  };

  const saveCategories = async (display, crowd) => {
    try {
      await onSave({
        ...preferences,
        disneyDisplayCategories: display,
        disneyCrowdCategories: crowd
      });
      setSaveMessage({ type: 'success', text: 'Settings saved' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSwitchToCategories = async () => {
    try {
      await onSave({
        ...preferences,
        disneyDisplayCategories: DEFAULT_DISPLAY_CATEGORIES,
        disneyCrowdCategories: DEFAULT_CROWD_CATEGORIES
      });
      setDisplayCategories(DEFAULT_DISPLAY_CATEGORIES);
      setCrowdCategories(DEFAULT_CROWD_CATEGORIES);
      setShowLegacy(false);
      setSaveMessage({ type: 'success', text: 'Switched to category-based filtering' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to switch' });
    }
  };

  const handleSwitchToLegacy = async () => {
    try {
      await onSave({
        ...preferences,
        disneyDisplayCategories: null,
        disneyCrowdCategories: null
      });
      setShowLegacy(true);
      await fetchAllRides();
      setSaveMessage({ type: 'success', text: 'Switched to individual ride selection' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to switch' });
    }
  };

  // Legacy handlers
  const isRideExcluded = (rideId) => excludedRides.includes(rideId);

  const toggleRide = async (rideId) => {
    const updatedExcluded = excludedRides.includes(rideId)
      ? excludedRides.filter(id => id !== rideId)
      : [...excludedRides, rideId];
    setExcludedRides(updatedExcluded);
    await onSave({ ...preferences, disneyExcludedRides: updatedExcluded, disneyKnownRides: knownRides });
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
        if (!updatedExcluded.includes(id)) updatedExcluded.push(id);
      });
    }
    setExcludedRides(updatedExcluded);
    await onSave({ ...preferences, disneyExcludedRides: updatedExcluded, disneyKnownRides: knownRides });
  };

  const currentParkRides = allRides[selectedPark] || [];
  const includedCount = currentParkRides.filter(r => !isRideExcluded(r.id)).length;
  const totalCount = currentParkRides.length;

  // Render category-based UI
  if (!showLegacy) {
    return (
      <div className="disney-ride-selection">
        <div className="ride-selection-header">
          <h2>Disney Dashboard Settings</h2>
          <p>Select which ride categories to display and include in crowd calculations</p>
        </div>

        <div className="category-selection">
          <section className="category-section">
            <h3>Categories to Display</h3>
            <p>Choose which ride categories appear on your Disney dashboard</p>
            <div className="category-checkboxes">
              {CATEGORIES.map(cat => (
                <label key={cat.value} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={displayCategories.includes(cat.value)}
                    onChange={() => toggleDisplayCategory(cat.value)}
                  />
                  <span className={`category-label category-${cat.value}`} style={{ backgroundColor: cat.color }}>
                    {cat.label}
                  </span>
                  <span className="category-description">
                    {cat.description}
                    {classificationStats && ` (${classificationStats[cat.value] || 0} rides)`}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="category-section">
            <h3>Categories for Crowd Level</h3>
            <p>Choose which categories are used to calculate the park crowd level</p>
            <div className="category-checkboxes">
              {CATEGORIES.map(cat => (
                <label key={cat.value} className="category-checkbox">
                  <input
                    type="checkbox"
                    checked={crowdCategories.includes(cat.value)}
                    onChange={() => toggleCrowdCategory(cat.value)}
                  />
                  <span className={`category-label category-${cat.value}`} style={{ backgroundColor: cat.color }}>
                    {cat.label}
                  </span>
                  <span className="category-description">
                    {classificationStats && `${classificationStats[cat.value] || 0} rides`}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="migration-notice" style={{ background: 'rgba(52, 152, 219, 0.1)', borderColor: '#3498db' }}>
            <p style={{ color: '#3498db' }}>Want more control? Switch to individual ride selection.</p>
            <button onClick={handleSwitchToLegacy} style={{ background: '#3498db' }}>
              Switch to Individual Selection
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`} style={{ marginTop: '1rem', textAlign: 'center' }}>
            {saveMessage.text}
          </div>
        )}
      </div>
    );
  }

  // Render legacy individual ride selection UI
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
              <button
                className="refresh-btn"
                onClick={() => fetchAllRides(true)}
                disabled={refreshing}
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

          <div className="migration-notice">
            <p>Simplify your settings with category-based filtering!</p>
            <button onClick={handleSwitchToCategories}>
              Switch to Categories
            </button>
            <button onClick={() => {}}>
              Keep Individual Selection
            </button>
          </div>
        </>
      )}

      {saveMessage && (
        <div className={`save-message ${saveMessage.type}`} style={{ marginTop: '1rem', textAlign: 'center' }}>
          {saveMessage.text}
        </div>
      )}
    </div>
  );
}

export default DisneyRideSelection;
