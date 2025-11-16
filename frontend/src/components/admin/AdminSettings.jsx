import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSettings.css';

function AdminSettings({ preferences, onSave }) {
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
    const updatedPrefs = {
      ...localPrefs,
      favoriteNHLTeam: team
    };
    setLocalPrefs(updatedPrefs);
    onSave(updatedPrefs);
  };

  const handleNFLTeamChange = (e) => {
    const team = nflTeams.find(t => t.abbrev === e.target.value);
    const updatedPrefs = {
      ...localPrefs,
      favoriteNFLTeam: team
    };
    setLocalPrefs(updatedPrefs);
    onSave(updatedPrefs);
  };

  const handleZipcodeChange = async (e) => {
    const zipcode = e.target.value;
    setZipcodeLookup('');
    setZipcodeError('');

    // Only update local state while typing, don't save partial data
    const updatedPrefs = {
      ...localPrefs,
      weatherLocation: {
        ...localPrefs.weatherLocation,
        zipcode: zipcode
      }
    };
    setLocalPrefs(updatedPrefs);

    // Only lookup and save when we have a complete 5-digit zipcode
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
          const completePrefs = {
            ...localPrefs,
            weatherLocation: {
              zipcode: zipcode,
              city: `${result.name}, ${result.admin1 || ''}`.trim(),
              latitude: result.latitude,
              longitude: result.longitude
            }
          };
          setLocalPrefs(completePrefs);
          setZipcodeLookup(`Found: ${result.name}, ${result.admin1 || ''}`);
          onSave(completePrefs);
        } else {
          setZipcodeError('Zipcode not found');
        }
      } catch (error) {
        console.error('Error looking up zipcode:', error);
        setZipcodeError('Error looking up zipcode');
      }
    }
  };

  return (
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

        </div>

        {/* Right Column */}
        <div>
          {/* Photo Slideshow Settings */}
          <div className="settings-section">
            <h3>Photo Slideshow</h3>

            <div className="setting-item">
              <label htmlFor="family-photo-interval">Family Photos Display Time (seconds)</label>
              <input
                id="family-photo-interval"
                type="number"
                min="1"
                max="300"
                value={(localPrefs.displaySettings?.familyPhotoInterval || 10000) / 1000}
                onChange={(e) => {
                  // Allow user to type freely, validate on blur
                  const value = e.target.value;
                  if (value === '') return; // Allow clearing the field

                  const seconds = parseInt(value);
                  if (isNaN(seconds)) return;

                  const updatedPrefs = {
                    ...localPrefs,
                    displaySettings: {
                      ...localPrefs.displaySettings,
                      familyPhotoInterval: seconds * 1000
                    }
                  };
                  setLocalPrefs(updatedPrefs);
                }}
                onBlur={(e) => {
                  // Validate and save when user is done editing
                  const seconds = Math.max(1, Math.min(300, parseInt(e.target.value) || 10));
                  const updatedPrefs = {
                    ...localPrefs,
                    displaySettings: {
                      ...localPrefs.displaySettings,
                      familyPhotoInterval: seconds * 1000
                    }
                  };
                  setLocalPrefs(updatedPrefs);
                  onSave(updatedPrefs);
                }}
                placeholder="10"
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                How long each family photo displays before transitioning (1-300 seconds)
              </small>
            </div>

            <div className="setting-item">
              <label htmlFor="event-photo-interval">Event Slides Display Time (seconds)</label>
              <input
                id="event-photo-interval"
                type="number"
                min="1"
                max="300"
                value={(localPrefs.displaySettings?.eventPhotoInterval || 10000) / 1000}
                onChange={(e) => {
                  // Allow user to type freely, validate on blur
                  const value = e.target.value;
                  if (value === '') return; // Allow clearing the field

                  const seconds = parseInt(value);
                  if (isNaN(seconds)) return;

                  const updatedPrefs = {
                    ...localPrefs,
                    displaySettings: {
                      ...localPrefs.displaySettings,
                      eventPhotoInterval: seconds * 1000
                    }
                  };
                  setLocalPrefs(updatedPrefs);
                }}
                onBlur={(e) => {
                  // Validate and save when user is done editing
                  const seconds = Math.max(1, Math.min(300, parseInt(e.target.value) || 10));
                  const updatedPrefs = {
                    ...localPrefs,
                    displaySettings: {
                      ...localPrefs.displaySettings,
                      eventPhotoInterval: seconds * 1000
                    }
                  };
                  setLocalPrefs(updatedPrefs);
                  onSave(updatedPrefs);
                }}
                placeholder="10"
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                How long each event slide displays before transitioning (1-300 seconds)
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
