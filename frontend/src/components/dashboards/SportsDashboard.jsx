import { useState, useEffect } from 'react';
import axios from 'axios';
import './SportsDashboard.css';
import TeamModal from './TeamModal';

function SportsDashboard({ preferences }) {
  const [selectedSport, setSelectedSport] = useState('nhl');
  const [nhlData, setNhlData] = useState({ recentGames: [], upcomingGames: [], standings: [] });
  const [nflData, setNflData] = useState({ recentGames: [], upcomingGames: [], standings: [] });
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); // { abbrev: 'PHI', name: 'Philadelphia Flyers' }

  // Get favorite teams from preferences
  const favoriteNHLTeam = preferences?.favoriteNHLTeam || { name: 'Philadelphia Flyers', abbrev: 'PHI' };
  const favoriteNFLTeam = preferences?.favoriteNFLTeam || { name: 'Philadelphia Eagles', abbrev: 'PHI' };

  // Helper function to check if a team is the favorite (works for both NHL and NFL)
  const isFavoriteTeam = (teamName) => {
    if (!teamName) return false;

    const teamNameLower = teamName.toLowerCase();

    // Check against NHL favorite
    if (selectedSport === 'nhl' && favoriteNHLTeam) {
      const favNameLower = favoriteNHLTeam.name.toLowerCase();
      const favAbbrevLower = favoriteNHLTeam.abbrev.toLowerCase();

      // Check full name match
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) {
        return true;
      }

      // Check abbreviation match
      if (teamNameLower.includes(favAbbrevLower)) {
        return true;
      }

      // Check individual words (e.g., "Senators" in "Ottawa Senators")
      const words = favNameLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && teamNameLower.includes(word)) {
          return true;
        }
      }
    }

    // Check against NFL favorite
    if (selectedSport === 'nfl' && favoriteNFLTeam) {
      const favNameLower = favoriteNFLTeam.name.toLowerCase();
      const favAbbrevLower = favoriteNFLTeam.abbrev.toLowerCase();

      // Check full name match
      if (teamNameLower.includes(favNameLower) || favNameLower.includes(teamNameLower)) {
        return true;
      }

      // Check abbreviation match
      if (teamNameLower.includes(favAbbrevLower)) {
        return true;
      }

      // Check individual words (e.g., "Eagles" in "Philadelphia Eagles")
      const words = favNameLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && teamNameLower.includes(word)) {
          return true;
        }
      }
    }

    return false;
  };

  // Helper function to get team logo URL
  const getTeamLogo = (teamName) => {
    if (!teamName) {
      console.log('getTeamLogo: No team name provided');
      return null;
    }

    // Map team names to their abbreviations for logo URLs
    const teamAbbrevMap = {
      // Full names
      'Anaheim Ducks': 'ANA',
      'Arizona Coyotes': 'ARI',
      'Boston Bruins': 'BOS',
      'Buffalo Sabres': 'BUF',
      'Calgary Flames': 'CGY',
      'Carolina Hurricanes': 'CAR',
      'Chicago Blackhawks': 'CHI',
      'Colorado Avalanche': 'COL',
      'Columbus Blue Jackets': 'CBJ',
      'Dallas Stars': 'DAL',
      'Detroit Red Wings': 'DET',
      'Edmonton Oilers': 'EDM',
      'Florida Panthers': 'FLA',
      'Los Angeles Kings': 'LAK',
      'Minnesota Wild': 'MIN',
      'Montréal Canadiens': 'MTL',
      'Montreal Canadiens': 'MTL',
      'Nashville Predators': 'NSH',
      'New Jersey Devils': 'NJD',
      'New York Islanders': 'NYI',
      'New York Rangers': 'NYR',
      'Ottawa Senators': 'OTT',
      'Philadelphia Flyers': 'PHI',
      'Pittsburgh Penguins': 'PIT',
      'San Jose Sharks': 'SJS',
      'Seattle Kraken': 'SEA',
      'St. Louis Blues': 'STL',
      'Tampa Bay Lightning': 'TBL',
      'Toronto Maple Leafs': 'TOR',
      'Utah Hockey Club': 'UTA',
      'Utah Mammoth': 'UTA',
      'Vancouver Canucks': 'VAN',
      'Vegas Golden Knights': 'VGK',
      'Washington Capitals': 'WSH',
      'Winnipeg Jets': 'WPG',
      // Short names (nickname only)
      'Ducks': 'ANA',
      'Coyotes': 'ARI',
      'Bruins': 'BOS',
      'Sabres': 'BUF',
      'Flames': 'CGY',
      'Hurricanes': 'CAR',
      'Blackhawks': 'CHI',
      'Avalanche': 'COL',
      'Blue Jackets': 'CBJ',
      'Stars': 'DAL',
      'Red Wings': 'DET',
      'Oilers': 'EDM',
      'Panthers': 'FLA',
      'Kings': 'LAK',
      'Wild': 'MIN',
      'Canadiens': 'MTL',
      'Predators': 'NSH',
      'Devils': 'NJD',
      'Islanders': 'NYI',
      'Rangers': 'NYR',
      'Senators': 'OTT',
      'Flyers': 'PHI',
      'Penguins': 'PIT',
      'Sharks': 'SJS',
      'Kraken': 'SEA',
      'Blues': 'STL',
      'Lightning': 'TBL',
      'Maple Leafs': 'TOR',
      'Hockey Club': 'UTA',
      'Mammoth': 'UTA',
      'Canucks': 'VAN',
      'Golden Knights': 'VGK',
      'Capitals': 'WSH',
      'Jets': 'WPG'
    };

    const abbrev = teamAbbrevMap[teamName];
    if (abbrev) {
      return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
    }
    return null;
  };

  // Helper function to get team abbreviation from team name
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

  // Handler for clicking on a team name
  const handleTeamClick = (teamName) => {
    if (selectedSport !== 'nhl') return; // Only works for NHL
    const abbrev = getTeamAbbrev(teamName);
    if (abbrev) {
      setSelectedTeam({ abbrev, name: teamName });
    }
  };

  // Fetch NHL data
  useEffect(() => {
    if (selectedSport === 'nhl') {
      fetchNHLData();
    } else if (selectedSport === 'nfl') {
      fetchNFLData();
    }
  }, [selectedSport]);

  const fetchNHLData = async () => {
    setLoading(true);
    try {
      // Get today's date and yesterday's date for recent games
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch today's and yesterday's scores for recent games (using proxy to avoid CORS)
      const [todayScores, yesterdayScores, standings] = await Promise.all([
        axios.get(`/api/nhl/v1/score/${todayStr}`),
        axios.get(`/api/nhl/v1/score/${yesterdayStr}`),
        axios.get(`/api/nhl/v1/standings/${todayStr}`)
      ]);

      // Process recent games (completed games from today and yesterday)
      const allGames = [...(yesterdayScores.data.games || []), ...(todayScores.data.games || [])];
      const recentGames = allGames
        .filter(game => game.gameState === 'OFF' || game.gameState === 'FINAL')
        .slice(0, 6)
        .map(game => {
          const homeTeamName = game.homeTeam.name.default || game.homeTeam.abbrev;
          const awayTeamName = game.awayTeam.name.default || game.awayTeam.abbrev;
          return {
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeScore: game.homeTeam.score,
            awayScore: game.awayTeam.score,
            status: 'Final',
            isFavorite: isFavoriteTeam(homeTeamName) || isFavoriteTeam(awayTeamName)
          };
        });

      // Process upcoming games (future or live games)
      const upcomingGames = allGames
        .filter(game => game.gameState === 'FUT' || game.gameState === 'LIVE' || game.gameState === 'CRIT')
        .slice(0, 6)
        .map(game => {
          const homeTeamName = game.homeTeam.name.default || game.homeTeam.abbrev;
          const awayTeamName = game.awayTeam.name.default || game.awayTeam.abbrev;
          const gameDate = new Date(game.startTimeUTC);
          const timeStr = gameDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          });
          return {
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            date: game.gameState === 'LIVE' ? 'LIVE NOW' : timeStr,
            isFavorite: isFavoriteTeam(homeTeamName) || isFavoriteTeam(awayTeamName),
            isLive: game.gameState === 'LIVE' || game.gameState === 'CRIT'
          };
        });

      // Process standings - get top teams
      const standingsData = standings.data.standings || [];
      const topTeams = standingsData.slice(0, 10).map(team => {
        const teamName = team.teamName?.default || team.teamAbbrev?.default || 'Unknown';
        const gamesPlayed = team.gamesPlayed || (team.wins + team.losses + (team.otLosses || 0));

        // Format streak (e.g., "W3", "L2", "OT1")
        let streak = '';
        if (team.streakCode && team.streakCount) {
          streak = `${team.streakCode}${team.streakCount}`;
        }

        return {
          team: teamName,
          gamesPlayed: gamesPlayed,
          wins: team.wins,
          losses: team.losses,
          points: team.points || 0,
          pct: ((team.wins / (team.wins + team.losses + team.otLosses)) || 0).toFixed(3),
          streak: streak,
          isFavorite: isFavoriteTeam(teamName)
        };
      });

      setNhlData({
        recentGames: recentGames.length > 0 ? recentGames : [{ homeTeam: 'No recent games', awayTeam: '', homeScore: '-', awayScore: '-', status: '' }],
        upcomingGames: upcomingGames.length > 0 ? upcomingGames : [{ homeTeam: 'No upcoming games', awayTeam: '', date: '' }],
        standings: topTeams.length > 0 ? topTeams : []
      });
    } catch (error) {
      console.error('Error fetching NHL data:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      setNhlData({
        recentGames: [{ homeTeam: 'Error loading data', awayTeam: '', homeScore: '-', awayScore: '-', status: error.message }],
        upcomingGames: [{ homeTeam: 'Error loading data', awayTeam: '', date: '' }],
        standings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNFLData = async () => {
    setLoading(true);
    try {
      // NFL division IDs from ESPN API
      const divisions = [
        { id: 1, name: 'NFC East', conference: 'NFC' },
        { id: 10, name: 'NFC North', conference: 'NFC' },
        { id: 11, name: 'NFC South', conference: 'NFC' },
        { id: 3, name: 'NFC West', conference: 'NFC' },
        { id: 4, name: 'AFC East', conference: 'AFC' },
        { id: 12, name: 'AFC North', conference: 'AFC' },
        { id: 13, name: 'AFC South', conference: 'AFC' },
        { id: 6, name: 'AFC West', conference: 'AFC' }
      ];

      // Fetch scoreboard and all division standings in parallel
      const requests = [
        axios.get('/api/nfl/apis/site/v2/sports/football/nfl/scoreboard'),
        ...divisions.map(div => axios.get(`/api/nfl/apis/v2/sports/football/nfl/standings?group=${div.id}`))
      ];

      const responses = await Promise.all(requests);
      const scoreboard = responses[0];
      const divisionResponses = responses.slice(1);

      // Process games from scoreboard
      const events = scoreboard.data.events || [];

      // Separate completed games and upcoming games
      const completed = events.filter(event => {
        const competition = event.competitions?.[0];
        return competition?.status?.type?.completed === true;
      }).map(event => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

        return {
          homeTeam: homeTeam.team.displayName,
          awayTeam: awayTeam.team.displayName,
          homeLogo: homeTeam.team.logo,
          awayLogo: awayTeam.team.logo,
          homeScore: parseInt(homeTeam.score || 0),
          awayScore: parseInt(awayTeam.score || 0),
          status: 'Final'
        };
      });

      const upcoming = events.filter(event => {
        const competition = event.competitions?.[0];
        return competition?.status?.type?.completed === false;
      }).map(event => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        const gameDate = new Date(event.date);
        const timeStr = gameDate.toLocaleString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        return {
          homeTeam: homeTeam.team.displayName,
          awayTeam: awayTeam.team.displayName,
          homeLogo: homeTeam.team.logo,
          awayLogo: awayTeam.team.logo,
          date: timeStr
        };
      });

      // Process division standings
      const divisionStandings = divisionResponses.map((response, index) => {
        const divisionInfo = divisions[index];
        const divisionData = response.data;
        const teams = [];

        // Get teams from division standings
        divisionData.standings?.entries?.forEach(teamEntry => {
          const stats = teamEntry.stats || [];
          const wins = stats.find(s => s.name === 'wins')?.value || 0;
          const losses = stats.find(s => s.name === 'losses')?.value || 0;
          const ties = stats.find(s => s.name === 'ties')?.value || 0;
          const winPercent = stats.find(s => s.name === 'winPercent')?.value || 0;

          // Get team logo - use the first logo (default)
          const logo = teamEntry.team.logos?.[0]?.href || null;

          teams.push({
            team: teamEntry.team.displayName,
            logo: logo,
            wins: wins,
            losses: losses,
            ties: ties,
            pct: winPercent.toFixed(3)
          });
        });

        return {
          division: divisionInfo.name,
          conference: divisionInfo.conference,
          teams: teams
        };
      });

      setNflData({
        recentGames: completed.length > 0 ? completed : [{ homeTeam: 'No recent games', awayTeam: '', homeScore: '-', awayScore: '-', status: '' }],
        upcomingGames: upcoming.length > 0 ? upcoming : [{ homeTeam: 'No upcoming games', awayTeam: '', date: '' }],
        standings: divisionStandings
      });
    } catch (error) {
      console.error('Error fetching NFL data:', error);
      setNflData({
        recentGames: [{ homeTeam: 'Error loading data', awayTeam: '', homeScore: '-', awayScore: '-', status: error.message }],
        upcomingGames: [{ homeTeam: 'Error loading data', awayTeam: '', date: '' }],
        standings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const sportsData = {
    nhl: {
      name: 'NHL',
      recentGames: nhlData.recentGames,
      upcomingGames: nhlData.upcomingGames,
      standings: nhlData.standings
    },
    nfl: {
      name: 'NFL',
      recentGames: nflData.recentGames,
      upcomingGames: nflData.upcomingGames,
      standings: nflData.standings
    },
    nba: {
      name: 'NBA',
      recentGames: [
        { homeTeam: 'Boston Celtics', awayTeam: 'Los Angeles Lakers', homeScore: 118, awayScore: 114, status: 'Final' },
        { homeTeam: 'Denver Nuggets', awayTeam: 'Phoenix Suns', homeScore: 125, awayScore: 119, status: 'Final' },
        { homeTeam: 'Milwaukee Bucks', awayTeam: 'Miami Heat', homeScore: 108, awayScore: 102, status: 'Final' },
      ],
      upcomingGames: [
        { homeTeam: 'Golden State Warriors', awayTeam: 'Sacramento Kings', date: 'Today 7:00 PM' },
        { homeTeam: 'Dallas Mavericks', awayTeam: 'Houston Rockets', date: 'Today 8:30 PM' },
        { homeTeam: 'Los Angeles Clippers', awayTeam: 'Portland Trail Blazers', date: 'Today 10:00 PM' },
      ],
      standings: [
        { team: 'Boston Celtics', wins: 5, losses: 0, pct: '1.000' },
        { team: 'Denver Nuggets', wins: 4, losses: 1, pct: '.800' },
        { team: 'Milwaukee Bucks', wins: 4, losses: 1, pct: '.800' },
        { team: 'Phoenix Suns', wins: 3, losses: 2, pct: '.600' },
        { team: 'Los Angeles Lakers', wins: 3, losses: 2, pct: '.600' },
      ]
    },
    mlb: {
      name: 'MLB',
      recentGames: [
        { homeTeam: 'Atlanta Braves', awayTeam: 'New York Mets', homeScore: 5, awayScore: 3, status: 'Final' },
        { homeTeam: 'Los Angeles Dodgers', awayTeam: 'San Diego Padres', homeScore: 7, awayScore: 4, status: 'Final' },
        { homeTeam: 'Houston Astros', awayTeam: 'Texas Rangers', homeScore: 4, awayScore: 2, status: 'Final' },
      ],
      upcomingGames: [
        { homeTeam: 'New York Yankees', awayTeam: 'Boston Red Sox', date: 'Today 7:05 PM' },
        { homeTeam: 'Chicago Cubs', awayTeam: 'St. Louis Cardinals', date: 'Today 8:10 PM' },
        { homeTeam: 'Seattle Mariners', awayTeam: 'Oakland Athletics', date: 'Today 9:40 PM' },
      ],
      standings: [
        { team: 'Atlanta Braves', wins: 92, losses: 58, pct: '.613' },
        { team: 'Los Angeles Dodgers', wins: 90, losses: 60, pct: '.600' },
        { team: 'Baltimore Orioles', wins: 88, losses: 62, pct: '.587' },
        { team: 'Tampa Bay Rays', wins: 87, losses: 63, pct: '.580' },
        { team: 'Houston Astros', wins: 85, losses: 65, pct: '.567' },
      ]
    }
  };

  const currentSportData = sportsData[selectedSport];

  return (
    <div className="sports-dashboard">
      <div className="dashboard-header">
        <h2>Sports Information</h2>
        <div className="sport-selector">
          {Object.keys(sportsData).map(sport => (
            <button
              key={sport}
              className={`sport-btn ${selectedSport === sport ? 'active' : ''}`}
              onClick={() => setSelectedSport(sport)}
            >
              {sportsData[sport].name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading {selectedSport === 'nhl' ? 'NHL' : selectedSport === 'nfl' ? 'NFL' : ''} data...</p>
        </div>
      ) : (
      <div className="dashboard-content">
        {/* Today's Games / Upcoming Games */}
        <div className="dashboard-card todays-games-card">
          <h3>{selectedSport === 'nhl' ? "Today's Games" : 'Upcoming Games'}</h3>
          <div className="games-list">
            {currentSportData.upcomingGames.map((game, index) => (
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
                        onClick={() => handleTeamClick(game.awayTeam)}
                      >
                        {game.awayTeam}
                      </span>
                    </div>
                    <span className="vs">@</span>
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
                        onClick={() => handleTeamClick(game.homeTeam)}
                      >
                        {game.homeTeam}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standings */}
        <div className="dashboard-card standings-card">
          <h3>Standings</h3>
          {selectedSport === 'nfl' && currentSportData.standings.length > 0 && currentSportData.standings[0].division ? (
            // NFL Division-based standings
            <div className="nfl-divisions">
              {currentSportData.standings.map((division, divIndex) => (
                <div key={divIndex} className="division-section">
                  <h4 className="division-name">{division.division}</h4>
                  <div className="standings-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Team</th>
                          <th>W</th>
                          <th>L</th>
                          <th>T</th>
                          <th>PCT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {division.teams.map((team, teamIndex) => (
                          <tr key={teamIndex}>
                            <td className="team-name-cell">
                              <div className="team-info">
                                {team.logo && (
                                  <img src={team.logo} alt={team.team} className="team-logo" />
                                )}
                                <span>{team.team}</span>
                              </div>
                            </td>
                            <td>{team.wins}</td>
                            <td>{team.losses}</td>
                            <td>{team.ties || 0}</td>
                            <td>{team.pct}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Standard standings table for other sports
            <div className="standings-table">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    {selectedSport === 'nhl' && <th>GP</th>}
                    <th>W</th>
                    <th>L</th>
                    {selectedSport === 'nhl' && <th>PTS</th>}
                    <th>PCT</th>
                    {selectedSport === 'nhl' && <th>Streak</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentSportData.standings.map((team, index) => (
                    <tr key={index} className={team.isFavorite ? 'favorite-team-row' : ''}>
                      <td className={`team-name-cell ${team.isFavorite ? 'favorite' : ''}`}>
                        <div className="team-info">
                          {selectedSport === 'nhl' && getTeamLogo(team.team) && (
                            <img src={getTeamLogo(team.team)} alt={team.team} className="team-logo" />
                          )}
                          <span
                            className={selectedSport === 'nhl' ? 'clickable' : ''}
                            onClick={() => handleTeamClick(team.team)}
                          >
                            {team.team}
                          </span>
                        </div>
                      </td>
                      {selectedSport === 'nhl' && <td>{team.gamesPlayed}</td>}
                      <td>{team.wins}</td>
                      <td>{team.losses}</td>
                      {selectedSport === 'nhl' && <td className="points-cell">{team.points}</td>}
                      <td>{team.pct}</td>
                      {selectedSport === 'nhl' && (
                        <td className={`streak-cell ${team.streak?.startsWith('W') ? 'win-streak' : team.streak?.startsWith('L') ? 'loss-streak' : ''}`}>
                          {team.streak || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      <div className="info-box">
        <p><strong>Note:</strong> {selectedSport === 'nhl' ? 'NHL data is live from the official NHL API! Click on any team name to see player stats.' : selectedSport === 'nfl' ? 'NFL data is live from the ESPN API!' : 'NBA and MLB are showing sample data. NHL and NFL use real live data.'}</p>
      </div>

      {/* Team Modal with Stats and News */}
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

export default SportsDashboard;
