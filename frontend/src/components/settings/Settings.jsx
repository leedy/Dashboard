import { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

function Settings({ preferences, onSave, onCancel }) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [zipcodeLookup, setZipcodeLookup] = useState('');
  const [zipcodeError, setZipcodeError] = useState('');

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // NHL Teams
  const nhlTeams = [
    { abbrev: 'ANA', name: 'Anaheim Ducks' },
    { abbrev: 'BOS', name: 'Boston Bruins' },
    { abbrev: 'BUF', name: 'Buffalo Sabres' },
    { abbrev: 'CGY', name: 'Calgary Flames' },
    { abbrev: 'CAR', name: 'Carolina Hurricanes' },
    { abbrev: 'CHI', name: 'Chicago Blackhawks' },
    { abbrev: 'COL', name: 'Colorado Avalanche' },
    { abbrev: 'CBJ', name: 'Columbus Blue Jackets' },
    { abbrev: 'DAL', name: 'Dallas Stars' },
    { abbrev: 'DET', name: 'Detroit Red Wings' },
    { abbrev: 'EDM', name: 'Edmonton Oilers' },
    { abbrev: 'FLA', name: 'Florida Panthers' },
    { abbrev: 'LAK', name: 'Los Angeles Kings' },
    { abbrev: 'MIN', name: 'Minnesota Wild' },
    { abbrev: 'MTL', name: 'Montréal Canadiens' },
    { abbrev: 'NSH', name: 'Nashville Predators' },
    { abbrev: 'NJD', name: 'New Jersey Devils' },
    { abbrev: 'NYI', name: 'New York Islanders' },
    { abbrev: 'NYR', name: 'New York Rangers' },
    { abbrev: 'OTT', name: 'Ottawa Senators' },
    { abbrev: 'PHI', name: 'Philadelphia Flyers' },
    { abbrev: 'PIT', name: 'Pittsburgh Penguins' },
    { abbrev: 'SJS', name: 'San Jose Sharks' },
    { abbrev: 'SEA', name: 'Seattle Kraken' },
    { abbrev: 'STL', name: 'St. Louis Blues' },
    { abbrev: 'TBL', name: 'Tampa Bay Lightning' },
    { abbrev: 'TOR', name: 'Toronto Maple Leafs' },
    { abbrev: 'UTA', name: 'Utah Hockey Club' },
    { abbrev: 'VAN', name: 'Vancouver Canucks' },
    { abbrev: 'VGK', name: 'Vegas Golden Knights' },
    { abbrev: 'WSH', name: 'Washington Capitals' },
    { abbrev: 'WPG', name: 'Winnipeg Jets' }
  ];

  // NFL Teams
  const nflTeams = [
    { abbrev: 'ARI', name: 'Arizona Cardinals' },
    { abbrev: 'ATL', name: 'Atlanta Falcons' },
    { abbrev: 'BAL', name: 'Baltimore Ravens' },
    { abbrev: 'BUF', name: 'Buffalo Bills' },
    { abbrev: 'CAR', name: 'Carolina Panthers' },
    { abbrev: 'CHI', name: 'Chicago Bears' },
    { abbrev: 'CIN', name: 'Cincinnati Bengals' },
    { abbrev: 'CLE', name: 'Cleveland Browns' },
    { abbrev: 'DAL', name: 'Dallas Cowboys' },
    { abbrev: 'DEN', name: 'Denver Broncos' },
    { abbrev: 'DET', name: 'Detroit Lions' },
    { abbrev: 'GB', name: 'Green Bay Packers' },
    { abbrev: 'HOU', name: 'Houston Texans' },
    { abbrev: 'IND', name: 'Indianapolis Colts' },
    { abbrev: 'JAX', name: 'Jacksonville Jaguars' },
    { abbrev: 'KC', name: 'Kansas City Chiefs' },
    { abbrev: 'LV', name: 'Las Vegas Raiders' },
    { abbrev: 'LAC', name: 'Los Angeles Chargers' },
    { abbrev: 'LAR', name: 'Los Angeles Rams' },
    { abbrev: 'MIA', name: 'Miami Dolphins' },
    { abbrev: 'MIN', name: 'Minnesota Vikings' },
    { abbrev: 'NE', name: 'New England Patriots' },
    { abbrev: 'NO', name: 'New Orleans Saints' },
    { abbrev: 'NYG', name: 'New York Giants' },
    { abbrev: 'NYJ', name: 'New York Jets' },
    { abbrev: 'PHI', name: 'Philadelphia Eagles' },
    { abbrev: 'PIT', name: 'Pittsburgh Steelers' },
    { abbrev: 'SF', name: 'San Francisco 49ers' },
    { abbrev: 'SEA', name: 'Seattle Seahawks' },
    { abbrev: 'TB', name: 'Tampa Bay Buccaneers' },
    { abbrev: 'TEN', name: 'Tennessee Titans' },
    { abbrev: 'WAS', name: 'Washington Commanders' }
  ];

  const handleNHLTeamChange = (e) => {
    const team = nhlTeams.find(t => t.abbrev === e.target.value);
    setLocalPrefs(prev => ({
      ...prev,
      favoriteNHLTeam: team
    }));
  };

  const handleNFLTeamChange = (e) => {
    const team = nflTeams.find(t => t.abbrev === e.target.value);
    setLocalPrefs(prev => ({
      ...prev,
      favoriteNFLTeam: team
    }));
  };

  const handleZipcodeChange = async (e) => {
    const zipcode = e.target.value;
    setZipcodeLookup('');
    setZipcodeError('');

    if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
      // Lookup location from zipcode using Open-Meteo geocoding API
      try {
        const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
          params: {
            name: zipcode,
            count: 1,
            language: 'en',
            format: 'json'
          }
        });

        if (response.data.results && response.data.results.length > 0) {
          const result = response.data.results[0];
          setLocalPrefs(prev => ({
            ...prev,
            weatherLocation: {
              zipcode: zipcode,
              city: `${result.name}, ${result.admin1 || ''}`.trim(),
              latitude: result.latitude,
              longitude: result.longitude
            }
          }));
          setZipcodeLookup(`Found: ${result.name}, ${result.admin1 || ''}`);
        } else {
          setZipcodeError('Zipcode not found');
        }
      } catch (error) {
        console.error('Error looking up zipcode:', error);
        setZipcodeError('Error looking up zipcode');
      }
    } else if (zipcode.length > 0) {
      setLocalPrefs(prev => ({
        ...prev,
        weatherLocation: {
          ...prev.weatherLocation,
          zipcode: zipcode
        }
      }));
    }
  };

  const handleDefaultDashboardChange = (e) => {
    setLocalPrefs(prev => ({
      ...prev,
      defaultDashboard: e.target.value
    }));
  };

  const handleSave = () => {
    onSave(localPrefs);
  };

  const handleCancel = () => {
    setLocalPrefs(preferences);
    onCancel();
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
          <p className="settings-subtitle">Customize your dashboard experience</p>
        </div>

        <div className="settings-grid">
          {/* Left Column */}
          <div>
            {/* Favorite Teams Section */}
            <div className="settings-section">
          <h3>Favorite Teams</h3>

          <div className="setting-item">
            <label htmlFor="nhl-team">NHL Team</label>
            <select
              id="nhl-team"
              value={localPrefs.favoriteNHLTeam.abbrev}
              onChange={handleNHLTeamChange}
            >
              {nhlTeams.map(team => (
                <option key={team.abbrev} value={team.abbrev}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="nfl-team">NFL Team</label>
            <select
              id="nfl-team"
              value={localPrefs.favoriteNFLTeam.abbrev}
              onChange={handleNFLTeamChange}
            >
              {nflTeams.map(team => (
                <option key={team.abbrev} value={team.abbrev}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
            </div>

            {/* Weather Location Section */}
            <div className="settings-section">
          <h3>Weather Location</h3>

          <div className="setting-item">
            <label htmlFor="zipcode">Zipcode</label>
            <input
              id="zipcode"
              type="text"
              value={localPrefs.weatherLocation.zipcode}
              onChange={handleZipcodeChange}
              placeholder="Enter 5-digit zipcode"
              maxLength="5"
            />
            {zipcodeLookup && <span className="zipcode-lookup success">{zipcodeLookup}</span>}
            {zipcodeError && <span className="zipcode-lookup error">{zipcodeError}</span>}
            {localPrefs.weatherLocation.city && !zipcodeLookup && !zipcodeError && (
              <span className="zipcode-lookup">{localPrefs.weatherLocation.city}</span>
            )}
          </div>
            </div>

            {/* Countdown Event Section */}
            <div className="settings-section">
          <h3>Countdown Event</h3>

          <div className="setting-item">
            <label htmlFor="event-name">Event Name</label>
            <input
              id="event-name"
              type="text"
              value={localPrefs.countdownEvent?.name || ''}
              onChange={(e) => setLocalPrefs(prev => ({
                ...prev,
                countdownEvent: {
                  ...prev.countdownEvent,
                  name: e.target.value
                }
              }))}
              placeholder="Enter event name"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="event-date">Event Date</label>
            <input
              id="event-date"
              type="date"
              value={localPrefs.countdownEvent?.date || ''}
              onChange={(e) => setLocalPrefs(prev => ({
                ...prev,
                countdownEvent: {
                  ...prev.countdownEvent,
                  date: e.target.value
                }
              }))}
            />
          </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Default Dashboard Section */}
            <div className="settings-section">
          <h3>Default Dashboard</h3>

          <div className="setting-item">
            <label htmlFor="default-dashboard">Dashboard to Show on Startup</label>
            <select
              id="default-dashboard"
              value={localPrefs.defaultDashboard === 'sports' ? 'todays-games' : localPrefs.defaultDashboard}
              onChange={handleDefaultDashboardChange}
            >
              <option value="todays-games">Today's Games</option>
              <option value="standings">Standings</option>
              <option value="weather">Weather</option>
              <option value="countdown">Countdown</option>
              <option value="disney">Disney Info</option>
              <option value="movies">Movies</option>
              <option value="fantasy-football">Fantasy Football</option>
            </select>
          </div>
            </div>

            {/* Display Settings Section */}
            <div className="settings-section">
          <h3>Display Settings</h3>

          <div className="setting-item">
            <label htmlFor="auto-rotate" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                id="auto-rotate"
                type="checkbox"
                checked={localPrefs.displaySettings?.autoRotate || false}
                onChange={(e) => setLocalPrefs(prev => ({
                  ...prev,
                  displaySettings: {
                    ...prev.displaySettings,
                    autoRotate: e.target.checked
                  }
                }))}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>Enable Auto-Rotate Dashboards</span>
            </label>
          </div>

          <div className="setting-item">
            <label htmlFor="rotate-interval">Rotation Interval (seconds)</label>
            <input
              id="rotate-interval"
              type="number"
              min="5"
              max="300"
              value={localPrefs.displaySettings?.rotateInterval || 30}
              onChange={(e) => setLocalPrefs(prev => ({
                ...prev,
                displaySettings: {
                  ...prev.displaySettings,
                  rotateInterval: parseInt(e.target.value) || 30
                }
              }))}
              placeholder="Enter seconds (5-300)"
              disabled={!localPrefs.displaySettings?.autoRotate}
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              How long to show each dashboard before rotating to the next
            </small>
          </div>

          <div className="setting-item" style={{ marginTop: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '600' }}>
              Dashboards to Include in Rotation
            </label>
            <small style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'block' }}>
              Select which dashboards to show during auto-rotation
            </small>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { id: 'todays-games', label: "Today's Games" },
                { id: 'upcoming-games', label: 'Upcoming Games' },
                { id: 'standings', label: 'Standings' },
                { id: 'weather', label: 'Weather' },
                { id: 'countdown', label: 'Countdown' },
                { id: 'disney', label: 'Disney Info' },
                { id: 'movies', label: 'Movies' },
                { id: 'family-photos', label: 'Family Photos' },
                { id: 'event-slides', label: 'Event Slides' }
              ].map(dashboard => (
                <label
                  key={dashboard.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={localPrefs.displaySettings?.rotationDashboards?.includes(dashboard.id) ?? true}
                    onChange={(e) => {
                      const currentDashboards = localPrefs.displaySettings?.rotationDashboards || [
                        'todays-games', 'upcoming-games', 'standings', 'weather',
                        'countdown', 'disney', 'movies', 'family-photos', 'event-slides'
                      ];

                      const updatedDashboards = e.target.checked
                        ? [...currentDashboards, dashboard.id]
                        : currentDashboards.filter(d => d !== dashboard.id);

                      setLocalPrefs(prev => ({
                        ...prev,
                        displaySettings: {
                          ...prev.displaySettings,
                          rotationDashboards: updatedDashboards
                        }
                      }));
                    }}
                    disabled={!localPrefs.displaySettings?.autoRotate}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <span>{dashboard.label}</span>
                </label>
              ))}
            </div>
          </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
