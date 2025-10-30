import { useState, useEffect } from 'react';
import axios from 'axios';
import './UpcomingGames.css';

function UpcomingGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamRecords, setTeamRecords] = useState({});

  // For now, hardcoded to Flyers (PHI)
  const teamAbbrev = 'PHI';
  const teamName = 'Philadelphia Flyers';

  useEffect(() => {
    fetchStandingsAndGames();
  }, []);

  const fetchStandingsAndGames = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch standings first
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const standingsResponse = await axios.get(`/api/nhl/v1/standings/${todayStr}`);
      const standingsData = standingsResponse.data.standings || [];

      // Create a map of team abbreviation to record
      const recordsMap = {};
      standingsData.forEach(team => {
        const abbrev = team.teamAbbrev?.default;
        if (abbrev) {
          recordsMap[abbrev] = {
            wins: team.wins || 0,
            losses: team.losses || 0,
            otLosses: team.otLosses || 0
          };
        }
      });
      setTeamRecords(recordsMap);

      // Now fetch games
      await fetchUpcomingGames(recordsMap);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load upcoming games');
      setLoading(false);
    }
  };

  const fetchUpcomingGames = async (recordsMap = {}) => {
    try {
      // Get current season (e.g., 20242025)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 0-indexed

      // NHL season typically starts in October and runs through next year
      // If it's before July, we're in the previous season's year
      const seasonStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      const season = `${seasonStartYear}${seasonStartYear + 1}`;

      console.log(`Fetching schedule for ${teamAbbrev}, season ${season}`);

      // Fetch full season schedule from NHL API
      const response = await axios.get(`/api/nhl/v1/club-schedule-season/${teamAbbrev}/${season}`);
      const scheduleData = response.data;

      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get date 10 days from now
      const tenDaysFromNow = new Date(today);
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

      // Filter for games in the next 10 days
      const upcomingGames = scheduleData.games
        .filter(game => {
          const gameDate = new Date(game.startTimeUTC);
          gameDate.setHours(0, 0, 0, 0);
          return gameDate >= today && gameDate <= tenDaysFromNow;
        })
        .slice(0, 10) // Limit to 10 games max
        .map(game => {
          const gameDate = new Date(game.startTimeUTC);
          const isHomeGame = game.homeTeam.abbrev === teamAbbrev;
          const opponent = isHomeGame ? game.awayTeam : game.homeTeam;

          // Get opponent's record from standings
          const opponentRecord = recordsMap[opponent.abbrev];
          const recordStr = opponentRecord
            ? `${opponentRecord.wins}-${opponentRecord.losses}-${opponentRecord.otLosses}`
            : '';

          return {
            id: game.id,
            date: gameDate,
            dateStr: gameDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            }),
            time: gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            }),
            isHomeGame,
            opponent: opponent.placeName?.default || opponent.commonName?.default || opponent.abbrev,
            opponentAbbrev: opponent.abbrev,
            opponentLogo: `https://assets.nhle.com/logos/nhl/svg/${opponent.abbrev}_light.svg`,
            record: recordStr,
            venue: game.venue?.default || '',
            gameState: game.gameState,
            tvBroadcasts: game.tvBroadcasts || []
          };
        });

      setGames(upcomingGames);
    } catch (err) {
      console.error('Error fetching upcoming games:', err);
      setError('Failed to load upcoming games');
    } finally {
      setLoading(false);
    }
  };

  const formatBroadcasts = (broadcasts) => {
    if (!broadcasts || broadcasts.length === 0) return 'TBD';
    return broadcasts
      .map(b => b.network)
      .filter(Boolean)
      .join(', ') || 'TBD';
  };

  if (loading) {
    return (
      <div className="upcoming-games-dashboard">
        <div className="dashboard-header">
          <h2>Upcoming Games - {teamName}</h2>
        </div>
        <div className="loading-container">
          <p>Loading upcoming games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upcoming-games-dashboard">
        <div className="dashboard-header">
          <h2>Upcoming Games - {teamName}</h2>
        </div>
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-games-dashboard">
      <div className="dashboard-header">
        <h2>Upcoming Games - {teamName}</h2>
        <p className="subtitle">Next 10 Days</p>
      </div>

      <div className="dashboard-content">
        {games.length === 0 ? (
          <div className="no-games">
            <p>No games scheduled in the next 10 days</p>
          </div>
        ) : (
          <div className="upcoming-games-list">
            {games.map((game) => (
              <div key={game.id} className="upcoming-game-card">
                <div className="game-date-time">
                  <div className="game-date">{game.dateStr}</div>
                  <div className="game-time">{game.time}</div>
                </div>

                <div className="game-matchup">
                  <div className="matchup-header">
                    <span className={`location-badge ${game.isHomeGame ? 'home' : 'away'}`}>
                      {game.isHomeGame ? 'HOME' : 'AWAY'}
                    </span>
                  </div>

                  <div className="opponent-info">
                    <img
                      src={game.opponentLogo}
                      alt={game.opponent}
                      className="opponent-logo"
                    />
                    <div className="opponent-details">
                      <div className="opponent-name">
                        {game.opponent}
                        {game.record && (
                          <span className="opponent-record"> ({game.record})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uncomment below to show venue and TV broadcast info */}
                {/* <div className="game-info">
                  {game.venue && (
                    <div className="venue">
                      <span className="info-label">Venue:</span> {game.venue}
                    </div>
                  )}
                  <div className="broadcast">
                    <span className="info-label">TV:</span> {formatBroadcasts(game.tvBroadcasts)}
                  </div>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UpcomingGames;
