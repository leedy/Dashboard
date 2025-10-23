import { useState, useEffect } from 'react';
import axios from 'axios';
import './SportsDashboard.css';

function SportsDashboard() {
  const [selectedSport, setSelectedSport] = useState('nhl');
  const [nhlData, setNhlData] = useState({ recentGames: [], upcomingGames: [], standings: [] });
  const [loading, setLoading] = useState(false);

  // Favorite team configuration (will be user-selectable in the future)
  const favoriteTeam = {
    name: 'Philadelphia Flyers',
    abbrev: 'PHI',
    searchTerms: ['Flyers', 'Philadelphia']
  };

  // Helper function to check if a team is the favorite
  const isFavoriteTeam = (teamName) => {
    if (!teamName) return false;
    return favoriteTeam.searchTerms.some(term =>
      teamName.toLowerCase().includes(term.toLowerCase())
    );
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
      'Canucks': 'VAN',
      'Golden Knights': 'VGK',
      'Capitals': 'WSH',
      'Jets': 'WPG'
    };

    const abbrev = teamAbbrevMap[teamName];
    if (abbrev) {
      const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
      console.log(`getTeamLogo: ${teamName} -> ${abbrev} -> ${logoUrl}`);
      return logoUrl;
    }

    console.log(`getTeamLogo: No mapping found for "${teamName}"`);
    return null;
  };

  // Fetch NHL data
  useEffect(() => {
    if (selectedSport === 'nhl') {
      fetchNHLData();
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
      console.log('Fetching NHL data for:', todayStr, yesterdayStr);
      const [todayScores, yesterdayScores, standings] = await Promise.all([
        axios.get(`/api/nhl/v1/score/${todayStr}`),
        axios.get(`/api/nhl/v1/score/${yesterdayStr}`),
        axios.get(`/api/nhl/v1/standings/${todayStr}`)
      ]);
      console.log('NHL API responses:', { todayScores: todayScores.data, yesterdayScores: yesterdayScores.data, standings: standings.data });

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

  const sportsData = {
    nhl: {
      name: 'NHL',
      recentGames: nhlData.recentGames,
      upcomingGames: nhlData.upcomingGames,
      standings: nhlData.standings
    },
    nfl: {
      name: 'NFL',
      recentGames: [
        { homeTeam: 'Kansas City Chiefs', awayTeam: 'Miami Dolphins', homeScore: 28, awayScore: 24, status: 'Final' },
        { homeTeam: 'San Francisco 49ers', awayTeam: 'Dallas Cowboys', homeScore: 31, awayScore: 21, status: 'Final' },
        { homeTeam: 'Buffalo Bills', awayTeam: 'New York Jets', homeScore: 35, awayScore: 14, status: 'Final' },
      ],
      upcomingGames: [
        { homeTeam: 'Green Bay Packers', awayTeam: 'Chicago Bears', date: 'Sun 1:00 PM' },
        { homeTeam: 'Philadelphia Eagles', awayTeam: 'Washington Commanders', date: 'Sun 4:25 PM' },
        { homeTeam: 'Los Angeles Rams', awayTeam: 'Seattle Seahawks', date: 'Sun 8:20 PM' },
      ],
      standings: [
        { team: 'Kansas City Chiefs', wins: 6, losses: 1, pct: '.857' },
        { team: 'San Francisco 49ers', wins: 5, losses: 2, pct: '.714' },
        { team: 'Philadelphia Eagles', wins: 5, losses: 2, pct: '.714' },
        { team: 'Buffalo Bills', wins: 5, losses: 2, pct: '.714' },
        { team: 'Miami Dolphins', wins: 4, losses: 3, pct: '.571' },
      ]
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

      {loading && selectedSport === 'nhl' ? (
        <div className="loading-container">
          <p>Loading NHL data...</p>
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
                      <span className={`team-name ${isFavoriteTeam(game.awayTeam) ? 'favorite' : ''}`}>{game.awayTeam}</span>
                    </div>
                    <span className="vs">@</span>
                  </div>
                  <div className="team-row">
                    <div className="team-info">
                      {selectedSport === 'nhl' && getTeamLogo(game.homeTeam) && (
                        <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
                      )}
                      <span className={`team-name ${isFavoriteTeam(game.homeTeam) ? 'favorite' : ''}`}>{game.homeTeam}</span>
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
          <div className="standings-table">
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>GP</th>
                  <th>W</th>
                  <th>L</th>
                  <th>PTS</th>
                  <th>PCT</th>
                  <th>Streak</th>
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
                        <span>{team.team}</span>
                      </div>
                    </td>
                    <td>{team.gamesPlayed}</td>
                    <td>{team.wins}</td>
                    <td>{team.losses}</td>
                    <td className="points-cell">{team.points}</td>
                    <td>{team.pct}</td>
                    <td className={`streak-cell ${team.streak?.startsWith('W') ? 'win-streak' : team.streak?.startsWith('L') ? 'loss-streak' : ''}`}>
                      {team.streak || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      <div className="info-box">
        <p><strong>Note:</strong> {selectedSport === 'nhl' ? 'NHL data is live from the official NHL API!' : 'NFL, NBA, and MLB are showing sample data. NHL uses real live data from the official NHL API.'}</p>
      </div>
    </div>
  );
}

export default SportsDashboard;
