import { useState, useEffect } from 'react';
import axios from 'axios';
import './FantasyFootball.css';

function FantasyFootball() {
  const [trendingAdds, setTrendingAdds] = useState([]);
  const [trendingDrops, setTrendingDrops] = useState([]);
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFantasyData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFantasyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFantasyData = async () => {
    try {
      // Fetch all players data first
      const playersResponse = await axios.get('/api/sleeper/v1/players/nfl');
      setPlayers(playersResponse.data);

      // Fetch trending players
      const trendingResponse = await axios.get('/api/sleeper/v1/players/nfl/trending/add?lookback_hours=24&limit=10');
      setTrendingAdds(trendingResponse.data);

      const dropsResponse = await axios.get('/api/sleeper/v1/players/nfl/trending/drop?lookback_hours=24&limit=10');
      setTrendingDrops(dropsResponse.data);

      setError(null);
    } catch (err) {
      console.error('Error fetching fantasy data:', err);
      setError('Failed to load fantasy football data');
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position) => {
    const colors = {
      'QB': '#e74c3c',
      'RB': '#3498db',
      'WR': '#2ecc71',
      'TE': '#f39c12',
      'K': '#9b59b6',
      'DEF': '#34495e'
    };
    return colors[position] || '#95a5a6';
  };

  const formatPlayerName = (player) => {
    if (!player) return 'Unknown Player';
    return `${player.first_name} ${player.last_name}`;
  };

  const getTeamLogo = (team) => {
    // Using ESPN's team logos
    const teamIds = {
      'ARI': 22, 'ATL': 1, 'BAL': 33, 'BUF': 2, 'CAR': 29, 'CHI': 3,
      'CIN': 4, 'CLE': 5, 'DAL': 6, 'DEN': 7, 'DET': 8, 'GB': 9,
      'HOU': 34, 'IND': 11, 'JAX': 30, 'KC': 12, 'LV': 13, 'LAC': 24,
      'LAR': 14, 'MIA': 15, 'MIN': 16, 'NE': 17, 'NO': 18, 'NYG': 19,
      'NYJ': 20, 'PHI': 21, 'PIT': 23, 'SF': 25, 'SEA': 26, 'TB': 27,
      'TEN': 10, 'WAS': 28
    };

    if (teamIds[team]) {
      return `https://a.espncdn.com/i/teamlogos/nfl/500/${team}.png`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="fantasy-football">
        <div className="loading-container">
          <p>Loading fantasy football data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fantasy-football">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fantasy-football">
      <div className="fantasy-header">
        <h1 className="fantasy-title">🏈 Fantasy Football Insights</h1>
        <p className="fantasy-subtitle">Trending Players • Last 24 Hours</p>
      </div>

      <div className="fantasy-content">
        {/* Trending Adds Section */}
        <div className="trending-section adds-section">
          <div className="section-header">
            <h2>🔥 Hot Adds</h2>
            <p>Most added players in the last 24 hours</p>
          </div>

          <div className="players-list">
            {trendingAdds.slice(0, 10).map((playerId, index) => {
              const player = players[playerId];
              if (!player) return null;

              return (
                <div key={playerId} className="player-card add-card">
                  <div className="player-rank">#{index + 1}</div>

                  <div className="player-info">
                    {player.team && getTeamLogo(player.team) && (
                      <img
                        src={getTeamLogo(player.team)}
                        alt={player.team}
                        className="team-logo"
                      />
                    )}

                    <div className="player-details">
                      <div className="player-name-row">
                        <span className="player-name">{formatPlayerName(player)}</span>
                        <span
                          className="player-position"
                          style={{ backgroundColor: getPositionColor(player.position) }}
                        >
                          {player.position}
                        </span>
                      </div>
                      <div className="player-team-info">
                        <span className="team-name">{player.team || 'FA'}</span>
                        {player.injury_status && (
                          <span className="injury-status">{player.injury_status}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="trend-indicator add-indicator">
                    <span className="trend-arrow">↑</span>
                    <span className="trend-label">ADD</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trending Drops Section */}
        <div className="trending-section drops-section">
          <div className="section-header">
            <h2>📉 Top Drops</h2>
            <p>Most dropped players in the last 24 hours</p>
          </div>

          <div className="players-list">
            {trendingDrops.slice(0, 10).map((playerId, index) => {
              const player = players[playerId];
              if (!player) return null;

              return (
                <div key={playerId} className="player-card drop-card">
                  <div className="player-rank">#{index + 1}</div>

                  <div className="player-info">
                    {player.team && getTeamLogo(player.team) && (
                      <img
                        src={getTeamLogo(player.team)}
                        alt={player.team}
                        className="team-logo"
                      />
                    )}

                    <div className="player-details">
                      <div className="player-name-row">
                        <span className="player-name">{formatPlayerName(player)}</span>
                        <span
                          className="player-position"
                          style={{ backgroundColor: getPositionColor(player.position) }}
                        >
                          {player.position}
                        </span>
                      </div>
                      <div className="player-team-info">
                        <span className="team-name">{player.team || 'FA'}</span>
                        {player.injury_status && (
                          <span className="injury-status">{player.injury_status}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="trend-indicator drop-indicator">
                    <span className="trend-arrow">↓</span>
                    <span className="trend-label">DROP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="fantasy-info">
        <p>💡 <strong>Tip:</strong> Hot adds indicate players gaining value. Consider picking them up before your league mates do!</p>
        <p className="data-source">Data provided by Sleeper API • Updates every 5 minutes</p>
      </div>
    </div>
  );
}

export default FantasyFootball;
