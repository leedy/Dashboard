import { useState, useEffect } from 'react';
import axios from 'axios';
import './SportsDashboard.css';
import PlayerStats from './PlayerStats';

function TodaysGames({ preferences }) {
  const [selectedSport, setSelectedSport] = useState('nhl');
  const [gamesData, setGamesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // { abbrev: 'PHI', name: 'Philadelphia Flyers' }

  const favoriteNHLTeam = preferences?.favoriteNHLTeam || { name: 'Philadelphia Flyers', abbrev: 'PHI' };
  const favoriteNFLTeam = preferences?.favoriteNFLTeam || { name: 'Philadelphia Eagles', abbrev: 'PHI' };

  // Initial fetch when sport changes
  useEffect(() => {
    if (selectedSport === 'nhl') {
      fetchNHLGames();
    } else if (selectedSport === 'nfl') {
      fetchNFLGames();
    }
  }, [selectedSport]);

  // Auto-refresh every 30 seconds for more responsive updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedSport === 'nhl') {
        fetchNHLGames();
      } else if (selectedSport === 'nfl') {
        fetchNFLGames();
      }
    }, 30000); // 30000ms = 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [selectedSport]);

  const isFavoriteTeam = (teamName) => {
    if (!teamName) return false;
    const teamNameLower = teamName.toLowerCase();

    if (selectedSport === 'nhl' && favoriteNHLTeam) {
      const favNameLower = favoriteNHLTeam.name.toLowerCase();
      const favAbbrevLower = favoriteNHLTeam.abbrev.toLowerCase();
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) return true;
      if (teamNameLower.includes(favAbbrevLower)) return true;
      const words = favNameLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && teamNameLower.includes(word)) return true;
      }
    }

    if (selectedSport === 'nfl' && favoriteNFLTeam) {
      const favNameLower = favoriteNFLTeam.name.toLowerCase();
      const favAbbrevLower = favoriteNFLTeam.abbrev.toLowerCase();
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) return true;
      if (teamNameLower.includes(favAbbrevLower)) return true;
      const words = favNameLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && teamNameLower.includes(word)) return true;
      }
    }

    return false;
  };

  const getTeamLogo = (teamName) => {
    if (!teamName) return null;
    const teamAbbrevMap = {
      'Anaheim Ducks': 'ANA', 'Ducks': 'ANA', 'Boston Bruins': 'BOS', 'Bruins': 'BOS',
      'Buffalo Sabres': 'BUF', 'Sabres': 'BUF', 'Calgary Flames': 'CGY', 'Flames': 'CGY',
      'Carolina Hurricanes': 'CAR', 'Hurricanes': 'CAR', 'Chicago Blackhawks': 'CHI', 'Blackhawks': 'CHI',
      'Colorado Avalanche': 'COL', 'Avalanche': 'COL', 'Columbus Blue Jackets': 'CBJ', 'Blue Jackets': 'CBJ',
      'Dallas Stars': 'DAL', 'Stars': 'DAL', 'Detroit Red Wings': 'DET', 'Red Wings': 'DET',
      'Edmonton Oilers': 'EDM', 'Oilers': 'EDM', 'Florida Panthers': 'FLA', 'Panthers': 'FLA',
      'Los Angeles Kings': 'LAK', 'Kings': 'LAK', 'Minnesota Wild': 'MIN', 'Wild': 'MIN',
      'Montréal Canadiens': 'MTL', 'Montreal Canadiens': 'MTL', 'Canadiens': 'MTL',
      'Nashville Predators': 'NSH', 'Predators': 'NSH', 'New Jersey Devils': 'NJD', 'Devils': 'NJD',
      'New York Islanders': 'NYI', 'Islanders': 'NYI', 'New York Rangers': 'NYR', 'Rangers': 'NYR',
      'Ottawa Senators': 'OTT', 'Senators': 'OTT', 'Philadelphia Flyers': 'PHI', 'Flyers': 'PHI',
      'Pittsburgh Penguins': 'PIT', 'Penguins': 'PIT', 'San Jose Sharks': 'SJS', 'Sharks': 'SJS',
      'Seattle Kraken': 'SEA', 'Kraken': 'SEA', 'St. Louis Blues': 'STL', 'Blues': 'STL',
      'Tampa Bay Lightning': 'TBL', 'Lightning': 'TBL', 'Toronto Maple Leafs': 'TOR', 'Maple Leafs': 'TOR',
      'Utah Hockey Club': 'UTA', 'Hockey Club': 'UTA', 'Utah Mammoth': 'UTA', 'Mammoth': 'UTA', 'Vancouver Canucks': 'VAN', 'Canucks': 'VAN',
      'Vegas Golden Knights': 'VGK', 'Golden Knights': 'VGK', 'Washington Capitals': 'WSH', 'Capitals': 'WSH',
      'Winnipeg Jets': 'WPG', 'Jets': 'WPG'
    };
    const abbrev = teamAbbrevMap[teamName];
    if (abbrev) {
      return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
    }
    return null;
  };

  const getTeamAbbrev = (teamName) => {
    if (!teamName) return null;
    const teamAbbrevMap = {
      'Anaheim Ducks': 'ANA', 'Ducks': 'ANA',
      'Arizona Coyotes': 'ARI', 'Coyotes': 'ARI',
      'Boston Bruins': 'BOS', 'Bruins': 'BOS',
      'Buffalo Sabres': 'BUF', 'Sabres': 'BUF',
      'Calgary Flames': 'CGY', 'Flames': 'CGY',
      'Carolina Hurricanes': 'CAR', 'Hurricanes': 'CAR',
      'Chicago Blackhawks': 'CHI', 'Blackhawks': 'CHI',
      'Colorado Avalanche': 'COL', 'Avalanche': 'COL',
      'Columbus Blue Jackets': 'CBJ', 'Blue Jackets': 'CBJ',
      'Dallas Stars': 'DAL', 'Stars': 'DAL',
      'Detroit Red Wings': 'DET', 'Red Wings': 'DET',
      'Edmonton Oilers': 'EDM', 'Oilers': 'EDM',
      'Florida Panthers': 'FLA', 'Panthers': 'FLA',
      'Los Angeles Kings': 'LAK', 'Kings': 'LAK',
      'Minnesota Wild': 'MIN', 'Wild': 'MIN',
      'Montréal Canadiens': 'MTL', 'Montreal Canadiens': 'MTL', 'Canadiens': 'MTL',
      'Nashville Predators': 'NSH', 'Predators': 'NSH',
      'New Jersey Devils': 'NJD', 'Devils': 'NJD',
      'New York Islanders': 'NYI', 'Islanders': 'NYI',
      'New York Rangers': 'NYR', 'Rangers': 'NYR',
      'Ottawa Senators': 'OTT', 'Senators': 'OTT',
      'Philadelphia Flyers': 'PHI', 'Flyers': 'PHI',
      'Pittsburgh Penguins': 'PIT', 'Penguins': 'PIT',
      'San Jose Sharks': 'SJS', 'Sharks': 'SJS',
      'Seattle Kraken': 'SEA', 'Kraken': 'SEA',
      'St. Louis Blues': 'STL', 'Blues': 'STL',
      'Tampa Bay Lightning': 'TBL', 'Lightning': 'TBL',
      'Toronto Maple Leafs': 'TOR', 'Maple Leafs': 'TOR',
      'Utah Hockey Club': 'UTA', 'Hockey Club': 'UTA',
      'Utah Mammoth': 'UTA', 'Mammoth': 'UTA',
      'Vancouver Canucks': 'VAN', 'Canucks': 'VAN',
      'Vegas Golden Knights': 'VGK', 'Golden Knights': 'VGK',
      'Washington Capitals': 'WSH', 'Capitals': 'WSH',
      'Winnipeg Jets': 'WPG', 'Jets': 'WPG'
    };
    return teamAbbrevMap[teamName] || null;
  };

  const handleTeamClick = (teamName) => {
    if (selectedSport !== 'nhl') return; // Only works for NHL
    const abbrev = getTeamAbbrev(teamName);
    if (abbrev) {
      setSelectedTeam({ abbrev, name: teamName });
    }
  };

  const fetchNHLGames = async () => {
    setLoading(true);
    try {
      const today = new Date();
      // Use local date, not UTC, to avoid date shifting issues
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      // Add timestamp to prevent caching
      const cacheBuster = Date.now();
      const response = await axios.get(`/api/nhl/v1/score/${todayStr}?_=${cacheBuster}`);

      // Show all games for today (don't filter by state to avoid missing any)
      const upcomingGames = (response.data.games || [])
        .map(game => {
          const homeTeamName = game.homeTeam.name.default || game.homeTeam.abbrev;
          const awayTeamName = game.awayTeam.name.default || game.awayTeam.abbrev;
          const gameDate = new Date(game.startTimeUTC);
          const timeStr = gameDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          });

          // Get period and clock info for live games
          let periodInfo = '';
          if (game.gameState === 'LIVE' || game.gameState === 'CRIT') {
            const period = game.period || game.periodDescriptor?.number;
            const clock = game.clock?.timeRemaining || '';
            if (period && clock) {
              periodInfo = `${period}${period === 1 ? 'st' : period === 2 ? 'nd' : period === 3 ? 'rd' : 'th'} ${clock}`;
            } else if (period) {
              periodInfo = `Period ${period}`;
            }
          }

          // Determine display status
          const isFinal = game.gameState === 'FINAL' || game.gameState === 'OFF';
          const isLive = game.gameState === 'LIVE' || game.gameState === 'CRIT';
          let displayDate;
          if (isFinal) {
            displayDate = 'FINAL';
          } else if (isLive) {
            displayDate = periodInfo || 'LIVE NOW';
          } else {
            displayDate = timeStr;
          }

          return {
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeScore: game.homeTeam.score || 0,
            awayScore: game.awayTeam.score || 0,
            date: displayDate,
            isFavorite: isFavoriteTeam(homeTeamName) || isFavoriteTeam(awayTeamName),
            isLive: isLive,
            isFinal: isFinal
          };
        });

      setGamesData(upcomingGames.length > 0 ? upcomingGames : [{ homeTeam: 'No games scheduled', awayTeam: '', date: '' }]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching NHL games:', error);
      setGamesData([{ homeTeam: 'Error loading data', awayTeam: '', date: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNFLGames = async () => {
    setLoading(true);
    try {
      // Add cache-busting
      const cacheBuster = Date.now();
      const response = await axios.get(`/api/nfl/apis/site/v2/sports/football/nfl/scoreboard?_=${cacheBuster}`);
      const events = response.data.events || [];

      const upcomingGames = events.map(event => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        const status = competition.status;
        const gameDate = new Date(event.date);
        const timeStr = gameDate.toLocaleString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        // Determine game state
        const isCompleted = status.type.completed;
        const isInProgress = status.type.state === 'in';
        const isFinal = isCompleted;
        const isLive = isInProgress;

        // Get game status display
        let displayDate;
        if (isFinal) {
          displayDate = 'FINAL';
        } else if (isLive) {
          // Show quarter and time for live games
          const period = status.period;
          const clock = status.displayClock;
          displayDate = `${period}Q ${clock}`;
        } else {
          displayDate = timeStr;
        }

        return {
          homeTeam: homeTeam.team.displayName,
          awayTeam: awayTeam.team.displayName,
          homeLogo: homeTeam.team.logo,
          awayLogo: awayTeam.team.logo,
          homeScore: parseInt(homeTeam.score) || 0,
          awayScore: parseInt(awayTeam.score) || 0,
          date: displayDate,
          isFavorite: isFavoriteTeam(homeTeam.team.displayName) || isFavoriteTeam(awayTeam.team.displayName),
          isLive: isLive,
          isFinal: isFinal
        };
      });

      setGamesData(upcomingGames.length > 0 ? upcomingGames : [{ homeTeam: 'No games scheduled', awayTeam: '', date: '' }]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching NFL games:', error);
      setGamesData([{ homeTeam: 'Error loading data', awayTeam: '', date: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="sports-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h2>Today's Games</h2>
          {lastUpdated && (
            <p className="last-updated">Last updated: {formatLastUpdated()}</p>
          )}
        </div>
        <div className="sport-selector">
          <button
            className={`sport-btn ${selectedSport === 'nhl' ? 'active' : ''}`}
            onClick={() => setSelectedSport('nhl')}
          >
            NHL
          </button>
          <button
            className={`sport-btn ${selectedSport === 'nfl' ? 'active' : ''}`}
            onClick={() => setSelectedSport('nfl')}
          >
            NFL
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading {selectedSport === 'nhl' ? 'NHL' : 'NFL'} games...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="dashboard-card todays-games-card">
            <div className="games-list">
              {gamesData.map((game, index) => (
                <div key={index} className={`game-card upcoming ${game.isFavorite ? 'favorite-team' : ''} ${game.isLive ? 'live-game' : ''}`}>
                  <div className={`game-time ${game.isLive ? 'live-indicator' : ''}`}>{game.date}</div>
                  <div className="game-matchup">
                    <div className="team-row">
                      <div className="team-info">
                        {selectedSport === 'nhl' && getTeamLogo(game.awayTeam) && (
                          <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="team-logo" />
                        )}
                        {selectedSport === 'nfl' && game.awayLogo && (
                          <img src={game.awayLogo} alt={game.awayTeam} className="team-logo" />
                        )}
                        <span
                          className={`team-name ${isFavoriteTeam(game.awayTeam) ? 'favorite' : ''} ${selectedSport === 'nhl' ? 'clickable' : ''}`}
                          onClick={selectedSport === 'nhl' ? () => handleTeamClick(game.awayTeam) : undefined}
                        >
                          {game.awayTeam}
                        </span>
                      </div>
                      {(game.isLive || game.isFinal) && game.awayScore !== undefined ? (
                        <span className={`team-score ${game.awayScore > game.homeScore ? 'winner' : ''}`}>
                          {game.awayScore}
                        </span>
                      ) : (
                        <span className="vs">@</span>
                      )}
                    </div>
                    <div className="team-row">
                      <div className="team-info">
                        {selectedSport === 'nhl' && getTeamLogo(game.homeTeam) && (
                          <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
                        )}
                        {selectedSport === 'nfl' && game.homeLogo && (
                          <img src={game.homeLogo} alt={game.homeTeam} className="team-logo" />
                        )}
                        <span
                          className={`team-name ${isFavoriteTeam(game.homeTeam) ? 'favorite' : ''} ${selectedSport === 'nhl' ? 'clickable' : ''}`}
                          onClick={selectedSport === 'nhl' ? () => handleTeamClick(game.homeTeam) : undefined}
                        >
                          {game.homeTeam}
                        </span>
                      </div>
                      {(game.isLive || game.isFinal) && game.homeScore !== undefined && (
                        <span className={`team-score ${game.homeScore > game.awayScore ? 'winner' : ''}`}>
                          {game.homeScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTeam && (
        <PlayerStats
          teamAbbrev={selectedTeam.abbrev}
          teamName={selectedTeam.name}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

export default TodaysGames;
