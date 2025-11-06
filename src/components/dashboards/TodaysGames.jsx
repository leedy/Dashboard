import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './SportsDashboard.css';
import TeamModal from './TeamModal';

function TodaysGames({ preferences, activeSport, availableSports }) {
  const [selectedSport, setSelectedSport] = useState('nhl');
  const [gamesData, setGamesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // { abbrev: 'PHI', name: 'Philadelphia Flyers' }
  const [teamRecords, setTeamRecords] = useState({}); // Store team records by abbreviation or name

  // Determine which sports have games available
  const availableSportsList = useMemo(() => {
    if (availableSports && !availableSports.loading) {
      return ['nhl', 'nfl', 'mlb'].filter(sport => availableSports[sport]);
    }
    return ['nhl', 'nfl', 'mlb']; // Show all while loading
  }, [availableSports?.nhl, availableSports?.nfl, availableSports?.mlb, availableSports?.loading]);

  // Initialize to first available sport
  useEffect(() => {
    if (availableSportsList.length > 0 && !availableSportsList.includes(selectedSport)) {
      setSelectedSport(availableSportsList[0]);
    }
  }, [availableSportsList, selectedSport]);
  // Update selected sport when activeSport prop changes (during auto-rotation)
  useEffect(() => {
    if (activeSport) {
      setSelectedSport(activeSport);
    }
  }, [activeSport]);

  const favoriteNHLTeam = preferences?.favoriteNHLTeam || { name: 'Philadelphia Flyers', abbrev: 'PHI' };
  const favoriteNFLTeam = preferences?.favoriteNFLTeam || { name: 'Philadelphia Eagles', abbrev: 'PHI' };
  const favoriteMLBTeam = preferences?.favoriteMLBTeam || { name: 'Philadelphia Phillies', abbrev: 'PHI' };

  // Initial fetch when sport changes
  useEffect(() => {
    if (selectedSport === 'nhl') {
      fetchNHLGames();
    } else if (selectedSport === 'nfl') {
      fetchNFLGames();
    } else if (selectedSport === 'mlb') {
      fetchMLBGames();
    }
  }, [selectedSport]);

  // Auto-refresh every 30 seconds for live game updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedSport === 'nhl') {
        fetchNHLGames();
      } else if (selectedSport === 'nfl') {
        fetchNFLGames();
      } else if (selectedSport === 'mlb') {
        fetchMLBGames();
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

    if (selectedSport === 'mlb' && favoriteMLBTeam) {
      const favNameLower = favoriteMLBTeam.name.toLowerCase();
      const favAbbrevLower = favoriteMLBTeam.abbrev.toLowerCase();
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

  const fetchNHLStandings = async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const response = await axios.get(`/api/nhl/v1/standings/${todayStr}`);
      const standingsData = response.data.standings || [];

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
      return recordsMap;
    } catch (error) {
      console.error('Error fetching NHL standings:', error);
      return {};
    }
  };

  const fetchNFLStandings = async () => {
    try {
      const divisions = [
        { id: 1 }, { id: 10 }, { id: 11 }, { id: 3 },
        { id: 4 }, { id: 12 }, { id: 13 }, { id: 6 }
      ];

      const requests = divisions.map(div =>
        axios.get(`/api/nfl/apis/v2/sports/football/nfl/standings?group=${div.id}`)
      );

      const responses = await Promise.all(requests);
      const recordsMap = {};

      responses.forEach(response => {
        response.data.standings?.entries?.forEach(teamEntry => {
          const teamName = teamEntry.team.displayName;
          const stats = teamEntry.stats || [];
          const wins = stats.find(s => s.name === 'wins')?.value || 0;
          const losses = stats.find(s => s.name === 'losses')?.value || 0;
          const ties = stats.find(s => s.name === 'ties')?.value || 0;

          recordsMap[teamName] = { wins, losses, ties };
        });
      });

      return recordsMap;
    } catch (error) {
      console.error('Error fetching NFL standings:', error);
      return {};
    }
  };

  const fetchMLBStandings = async () => {
    try {
      // MLB uses divisions 5, 6, 7 for AL and 15, 16, 17 for NL
      const divisions = [5, 6, 7, 15, 16, 17];

      const requests = divisions.map(divId =>
        axios.get(`/api/mlb/apis/v2/sports/baseball/mlb/standings?group=${divId}`)
      );

      const responses = await Promise.all(requests);
      const recordsMap = {};

      responses.forEach(response => {
        response.data.standings?.entries?.forEach(teamEntry => {
          const teamName = teamEntry.team.displayName;
          const stats = teamEntry.stats || [];
          const wins = stats.find(s => s.name === 'wins')?.value || 0;
          const losses = stats.find(s => s.name === 'losses')?.value || 0;

          recordsMap[teamName] = { wins, losses };
        });
      });

      return recordsMap;
    } catch (error) {
      console.error('Error fetching MLB standings:', error);
      return {};
    }
  };

  const fetchNHLGames = async () => {
    setLoading(true);
    try {
      // Fetch standings first to get team records
      const recordsMap = await fetchNHLStandings();
      setTeamRecords(recordsMap);

      // Use cached game data endpoint
      const response = await axios.get(`/api/games/nhl`);
      const apiData = response.data.data; // Extract actual game data from cache response

      // Show all games for today (don't filter by state to avoid missing any)
      const upcomingGames = (apiData.games || [])
        .map(game => {
          const homeTeamName = game.homeTeam.name.default || game.homeTeam.abbrev;
          const awayTeamName = game.awayTeam.name.default || game.awayTeam.abbrev;
          const homeTeamAbbrev = game.homeTeam.abbrev;
          const awayTeamAbbrev = game.awayTeam.abbrev;
          const gameDate = new Date(game.startTimeUTC);
          const timeStr = gameDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          });

          // Get team records
          const homeRecord = recordsMap[homeTeamAbbrev];
          const awayRecord = recordsMap[awayTeamAbbrev];
          const homeRecordStr = homeRecord ? `${homeRecord.wins}-${homeRecord.losses}-${homeRecord.otLosses}` : '';
          const awayRecordStr = awayRecord ? `${awayRecord.wins}-${awayRecord.losses}-${awayRecord.otLosses}` : '';

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
            homeRecord: homeRecordStr,
            awayRecord: awayRecordStr,
            homeScore: game.homeTeam.score || 0,
            awayScore: game.awayTeam.score || 0,
            date: displayDate,
            startTime: gameDate,
            isFavorite: isFavoriteTeam(homeTeamName) || isFavoriteTeam(awayTeamName),
            isLive: isLive,
            isFinal: isFinal
          };
        })
        .sort((a, b) => {
          // Live games first
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          // Then sort by start time
          return a.startTime - b.startTime;
        });

      setGamesData(upcomingGames.length > 0 ? upcomingGames : [{ homeTeam: 'No games scheduled', awayTeam: '', date: '' }]);
      setLastUpdated(new Date(response.data.lastUpdated));
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
      // Fetch standings first to get team records
      const recordsMap = await fetchNFLStandings();
      setTeamRecords(recordsMap);

      // Use cached game data endpoint
      const response = await axios.get(`/api/games/nfl`);
      const apiData = response.data.data; // Extract actual game data from cache response
      const events = apiData.events || [];

      const upcomingGames = events
        .map(event => {
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

          // Get team records
          const homeRecord = recordsMap[homeTeam.team.displayName];
          const awayRecord = recordsMap[awayTeam.team.displayName];
          const homeRecordStr = homeRecord
            ? homeRecord.ties > 0
              ? `${homeRecord.wins}-${homeRecord.losses}-${homeRecord.ties}`
              : `${homeRecord.wins}-${homeRecord.losses}`
            : '';
          const awayRecordStr = awayRecord
            ? awayRecord.ties > 0
              ? `${awayRecord.wins}-${awayRecord.losses}-${awayRecord.ties}`
              : `${awayRecord.wins}-${awayRecord.losses}`
            : '';

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
            homeRecord: homeRecordStr,
            awayRecord: awayRecordStr,
            homeLogo: homeTeam.team.logo,
            awayLogo: awayTeam.team.logo,
            homeScore: parseInt(homeTeam.score) || 0,
            awayScore: parseInt(awayTeam.score) || 0,
            date: displayDate,
            startTime: gameDate,
            isFavorite: isFavoriteTeam(homeTeam.team.displayName) || isFavoriteTeam(awayTeam.team.displayName),
            isLive: isLive,
            isFinal: isFinal
          };
        })
        .sort((a, b) => {
          // Live games first
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          // Then sort by start time
          return a.startTime - b.startTime;
        });

      setGamesData(upcomingGames.length > 0 ? upcomingGames : [{ homeTeam: 'No games scheduled', awayTeam: '', date: '' }]);
      setLastUpdated(new Date(response.data.lastUpdated));
    } catch (error) {
      console.error('Error fetching NFL games:', error);
      setGamesData([{ homeTeam: 'Error loading data', awayTeam: '', date: error.message }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMLBGames = async () => {
    setLoading(true);
    try {
      // Fetch standings first to get team records
      const recordsMap = await fetchMLBStandings();
      setTeamRecords(recordsMap);

      // Use cached game data endpoint
      const response = await axios.get(`/api/games/mlb`);
      const apiData = response.data.data; // Extract actual game data from cache response
      const events = apiData.events || [];

      const upcomingGames = events
        .map(event => {
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

          // Get team records
          const homeRecord = recordsMap[homeTeam.team.displayName];
          const awayRecord = recordsMap[awayTeam.team.displayName];
          const homeRecordStr = homeRecord ? `${homeRecord.wins}-${homeRecord.losses}` : '';
          const awayRecordStr = awayRecord ? `${awayRecord.wins}-${awayRecord.losses}` : '';

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
            // Show inning and status for live games
            const inning = status.period;
            const inningState = status.type.shortDetail || '';
            // Format like "Top 5th" or "Bot 3rd"
            displayDate = inningState || `Inning ${inning}`;
          } else {
            displayDate = timeStr;
          }

          return {
            homeTeam: homeTeam.team.displayName,
            awayTeam: awayTeam.team.displayName,
            homeRecord: homeRecordStr,
            awayRecord: awayRecordStr,
            homeLogo: homeTeam.team.logo,
            awayLogo: awayTeam.team.logo,
            homeScore: parseInt(homeTeam.score) || 0,
            awayScore: parseInt(awayTeam.score) || 0,
            date: displayDate,
            startTime: gameDate,
            isFavorite: isFavoriteTeam(homeTeam.team.displayName) || isFavoriteTeam(awayTeam.team.displayName),
            isLive: isLive,
            isFinal: isFinal
          };
        })
        .sort((a, b) => {
          // Live games first
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          // Then sort by start time
          return a.startTime - b.startTime;
        });

      setGamesData(upcomingGames.length > 0 ? upcomingGames : [{ homeTeam: 'No games scheduled', awayTeam: '', date: '' }]);
      setLastUpdated(new Date(response.data.lastUpdated));
    } catch (error) {
      console.error('Error fetching MLB games:', error);
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
          {availableSportsList.includes('nhl') && (
            <button
              className={`sport-btn ${selectedSport === 'nhl' ? 'active' : ''}`}
              onClick={() => setSelectedSport('nhl')}
            >
              NHL
            </button>
          )}
          {availableSportsList.includes('nfl') && (
            <button
              className={`sport-btn ${selectedSport === 'nfl' ? 'active' : ''}`}
              onClick={() => setSelectedSport('nfl')}
            >
              NFL
            </button>
          )}
          {availableSportsList.includes('mlb') && (
            <button
              className={`sport-btn ${selectedSport === 'mlb' ? 'active' : ''}`}
              onClick={() => setSelectedSport('mlb')}
            >
              MLB
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading {selectedSport === 'nhl' ? 'NHL' : selectedSport === 'nfl' ? 'NFL' : 'MLB'} games...</p>
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
                        {(selectedSport === 'nfl' || selectedSport === 'mlb') && game.awayLogo && (
                          <img src={game.awayLogo} alt={game.awayTeam} className="team-logo" />
                        )}
                        <span
                          className={`team-name ${isFavoriteTeam(game.awayTeam) ? 'favorite' : ''} ${selectedSport === 'nhl' ? 'clickable' : ''}`}
                          onClick={selectedSport === 'nhl' ? () => handleTeamClick(game.awayTeam) : undefined}
                        >
                          {game.awayTeam}
                          {game.awayRecord && (
                            <span className="team-record"> ({game.awayRecord})</span>
                          )}
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
                        {(selectedSport === 'nfl' || selectedSport === 'mlb') && game.homeLogo && (
                          <img src={game.homeLogo} alt={game.homeTeam} className="team-logo" />
                        )}
                        <span
                          className={`team-name ${isFavoriteTeam(game.homeTeam) ? 'favorite' : ''} ${selectedSport === 'nhl' ? 'clickable' : ''}`}
                          onClick={selectedSport === 'nhl' ? () => handleTeamClick(game.homeTeam) : undefined}
                        >
                          {game.homeTeam}
                          {game.homeRecord && (
                            <span className="team-record"> ({game.homeRecord})</span>
                          )}
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
        <TeamModal
          teamAbbrev={selectedTeam.abbrev}
          teamName={selectedTeam.name}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

export default TodaysGames;
