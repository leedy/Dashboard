import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import './SportsDashboard.css';
import TeamModal from './TeamModal';
import GoalDetailsModal from './GoalDetailsModal';

function TodaysGames({ preferences, activeSport, availableSports }) {
  const [selectedSport, setSelectedSport] = useState('nhl');
  const [gamesData, setGamesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // { abbrev: 'PHI', name: 'Philadelphia Flyers' }
  const [teamRecords, setTeamRecords] = useState({}); // Store team records by abbreviation or name
  const [selectedGame, setSelectedGame] = useState(null); // For goal details modal
  const [, setRenderTick] = useState(0); // Dummy state to force re-renders for countdown
  const intermissionTimersRef = useRef({}); // Track intermission start times by gameId

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

  // Helper function to calculate remaining intermission time
  const calculateIntermissionTime = (gameId, apiTime) => {
    if (!apiTime) return '';

    // Parse API time (MM:SS format) to total seconds
    const parts = apiTime.split(':');
    const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);

    // Check if we have a stored start time for this intermission
    if (!intermissionTimersRef.current[gameId]) {
      // First time seeing this intermission - store the start time and duration
      intermissionTimersRef.current[gameId] = {
        startTime: Date.now(),
        duration: totalSeconds
      };
    }

    const timer = intermissionTimersRef.current[gameId];
    const elapsedSeconds = Math.floor((Date.now() - timer.startTime) / 1000);
    const remainingSeconds = Math.max(0, timer.duration - elapsedSeconds);

    // Format as MM:SS
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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

  // Force re-render every second for intermission countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTick(tick => tick + 1);
    }, 1000); // 1000ms = 1 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const isFavoriteTeam = (teamName) => {
    if (!teamName) return false;
    const teamNameLower = teamName.toLowerCase();

    if (selectedSport === 'nhl' && favoriteNHLTeam) {
      const favNameLower = favoriteNHLTeam.name.toLowerCase();
      // Check for exact team name match or partial match
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) return true;
      // Check if any significant word from the team name matches
      const words = favNameLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && teamNameLower.includes(word)) return true;
      }
    }

    if (selectedSport === 'nfl' && favoriteNFLTeam) {
      const favNameLower = favoriteNFLTeam.name.toLowerCase();
      // Check for exact team name match or partial match
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) return true;
      // Check if any significant word from the team name matches
      const words = favNameLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && teamNameLower.includes(word)) return true;
      }
    }

    if (selectedSport === 'mlb' && favoriteMLBTeam) {
      const favNameLower = favoriteMLBTeam.name.toLowerCase();
      // Check for exact team name match or partial match
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) return true;
      // Check if any significant word from the team name matches
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

  const handleGameTimeClick = (game) => {
    // Only for NHL games that have started or finished (have goals to show)
    if (selectedSport !== 'nhl') return;
    if (!game.gameId) return;
    if (!game.isLive && !game.isFinal) return; // Only show for live or final games

    setSelectedGame({
      gameId: game.gameId,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam
    });
  };

  const fetchNHLStandings = async () => {
    try {
      const response = await axios.get(`/api/standings/nhl`);
      return response.data.data; // Return the cached standings data (already in recordsMap format)
    } catch (error) {
      console.error('Error fetching NHL standings:', error);
      return {};
    }
  };

  const fetchNFLStandings = async () => {
    try {
      const response = await axios.get(`/api/standings/nfl`);
      return response.data.data; // Return the cached standings data (already in recordsMap format)
    } catch (error) {
      console.error('Error fetching NFL standings:', error);
      return {};
    }
  };

  const fetchMLBStandings = async () => {
    try {
      const response = await axios.get(`/api/standings/mlb`);
      return response.data.data; // Return the cached standings data (already in recordsMap format)
    } catch (error) {
      console.error('Error fetching MLB standings:', error);
      return {};
    }
  };

  const fetchNHLGames = async () => {
    setLoading(true);
    try {
      // Fetch standings and games in parallel for faster loading
      const [recordsMap, response] = await Promise.all([
        fetchNHLStandings(),
        axios.get(`/api/games/nhl`)
      ]);
      setTeamRecords(recordsMap);

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
          let inIntermission = false;
          let intermissionClock = '';
          if (game.gameState === 'LIVE' || game.gameState === 'CRIT') {
            const period = game.period || game.periodDescriptor?.number;
            const clock = game.clock?.timeRemaining || '';
            inIntermission = game.clock?.inIntermission || false;

            if (period && inIntermission) {
              // Period has ended - in intermission - show "End" messages
              intermissionClock = clock; // Store the API's intermission time
              if (period === 1) {
                periodInfo = 'End 1st';
              } else if (period === 2) {
                periodInfo = 'End 2nd';
              } else if (period === 3) {
                periodInfo = 'End Regulation';
              } else if (period >= 4) {
                periodInfo = 'End Overtime';
              }
            } else {
              // Not in intermission - clear any stored timer for this game
              if (intermissionTimersRef.current[game.id]) {
                delete intermissionTimersRef.current[game.id];
              }

              if (period && clock) {
                // Normal in-progress period - show period and time
                periodInfo = `${period}${period === 1 ? 'st' : period === 2 ? 'nd' : period === 3 ? 'rd' : 'th'} ${clock}`;
              } else if (period) {
                periodInfo = `Period ${period}`;
              }
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
            gameId: game.id,
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
            isFinal: isFinal,
            inIntermission: inIntermission,
            intermissionClock: intermissionClock
          };
        })
        .sort((a, b) => {
          // Favorite team games first
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // Then live games
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
      // Fetch standings and games in parallel for faster loading
      const [recordsMap, response] = await Promise.all([
        fetchNFLStandings(),
        axios.get(`/api/games/nfl`)
      ]);
      setTeamRecords(recordsMap);

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
          // Favorite team games first
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // Then live games
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          // Then upcoming games (not final) before final games
          if (!a.isFinal && b.isFinal) return -1;
          if (a.isFinal && !b.isFinal) return 1;
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
      // Fetch standings and games in parallel for faster loading
      const [recordsMap, response] = await Promise.all([
        fetchMLBStandings(),
        axios.get(`/api/games/mlb`)
      ]);
      setTeamRecords(recordsMap);

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
          // Favorite team games first
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // Then live games
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

  const getHeaderTitle = () => {
    if (selectedSport === 'nfl') {
      return "This Week's Games";
    }
    return "Today's Games";
  };

  return (
    <div className="sports-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <h2>{getHeaderTitle()}</h2>
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
                  <div
                    className={`game-time ${game.isLive ? 'live-indicator' : ''} ${selectedSport === 'nhl' && (game.isLive || game.isFinal) && game.gameId ? 'clickable-time' : ''} ${game.inIntermission ? 'intermission-display' : ''}`}
                    onClick={() => handleGameTimeClick(game)}
                    style={{
                      cursor: selectedSport === 'nhl' && (game.isLive || game.isFinal) && game.gameId ? 'pointer' : 'default'
                    }}
                  >
                    <span>{game.date}</span>
                    {selectedSport === 'nhl' && game.inIntermission && game.intermissionClock && (
                      <span className="intermission-countdown">
                        {calculateIntermissionTime(game.gameId, game.intermissionClock)}
                      </span>
                    )}
                  </div>
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

      {selectedGame && (
        <GoalDetailsModal
          gameId={selectedGame.gameId}
          homeTeam={selectedGame.homeTeam}
          awayTeam={selectedGame.awayTeam}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}

export default TodaysGames;
