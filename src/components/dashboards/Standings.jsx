import { useState, useEffect } from 'react';
import axios from 'axios';
import './SportsDashboard.css';
import PlayerStats from './PlayerStats';

function Standings({ preferences }) {
  const [selectedSport, setSelectedSport] = useState('nhl');
  const [nhlStandings, setNhlStandings] = useState([]);
  const [nflStandings, setNflStandings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); // { abbrev: 'PHI', name: 'Philadelphia Flyers' }

  const favoriteNHLTeam = preferences?.favoriteNHLTeam || { name: 'Philadelphia Flyers', abbrev: 'PHI' };
  const favoriteNFLTeam = preferences?.favoriteNFLTeam || { name: 'Philadelphia Eagles', abbrev: 'PHI' };

  useEffect(() => {
    if (selectedSport === 'nhl') {
      fetchNHLStandings();
    } else if (selectedSport === 'nfl') {
      fetchNFLStandings();
    }
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
      'Utah Hockey Club': 'UTA', 'Hockey Club': 'UTA', 'Vancouver Canucks': 'VAN', 'Canucks': 'VAN',
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
    if (selectedSport !== 'nhl') return;
    const abbrev = getTeamAbbrev(teamName);
    if (abbrev) {
      setSelectedTeam({ abbrev, name: teamName });
    }
  };

  const fetchNHLStandings = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const response = await axios.get(`/api/nhl/v1/standings/${todayStr}`);

      const standingsData = response.data.standings || [];
      const topTeams = standingsData.slice(0, 10).map(team => {
        const teamName = team.teamName?.default || team.teamAbbrev?.default || 'Unknown';
        const gamesPlayed = team.gamesPlayed || (team.wins + team.losses + (team.otLosses || 0));

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

      setNhlStandings(topTeams.length > 0 ? topTeams : []);
    } catch (error) {
      console.error('Error fetching NHL standings:', error);
      setNhlStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNFLStandings = async () => {
    setLoading(true);
    try {
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

      const requests = divisions.map(div =>
        axios.get(`/api/nfl/apis/v2/sports/football/nfl/standings?group=${div.id}`)
      );

      const responses = await Promise.all(requests);

      const divisionStandings = responses.map((response, index) => {
        const divisionInfo = divisions[index];
        const divisionData = response.data;
        const teams = [];

        divisionData.standings?.entries?.forEach(teamEntry => {
          const stats = teamEntry.stats || [];
          const wins = stats.find(s => s.name === 'wins')?.value || 0;
          const losses = stats.find(s => s.name === 'losses')?.value || 0;
          const ties = stats.find(s => s.name === 'ties')?.value || 0;
          const winPercent = stats.find(s => s.name === 'winPercent')?.value || 0;
          const logo = teamEntry.team.logos?.[0]?.href || null;

          teams.push({
            team: teamEntry.team.displayName,
            logo: logo,
            wins: wins,
            losses: losses,
            ties: ties,
            pct: winPercent.toFixed(3),
            isFavorite: isFavoriteTeam(teamEntry.team.displayName)
          });
        });

        return {
          division: divisionInfo.name,
          conference: divisionInfo.conference,
          teams: teams
        };
      });

      setNflStandings(divisionStandings);
    } catch (error) {
      console.error('Error fetching NFL standings:', error);
      setNflStandings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sports-dashboard">
      <div className="dashboard-header">
        <h2>Standings</h2>
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
          <p>Loading {selectedSport === 'nhl' ? 'NHL' : 'NFL'} standings...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <div className="dashboard-card standings-card">
            <h3>{selectedSport === 'nhl' ? 'Top 10 Teams' : 'Division Standings'}</h3>
            {selectedSport === 'nfl' && nflStandings.length > 0 ? (
              <div className="nfl-divisions">
                {nflStandings.map((division, divIndex) => (
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
                            <tr key={teamIndex} className={team.isFavorite ? 'favorite-team-row' : ''}>
                              <td className={`team-name-cell ${team.isFavorite ? 'favorite' : ''}`}>
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
                    {nhlStandings.map((team, index) => (
                      <tr key={index} className={team.isFavorite ? 'favorite-team-row' : ''}>
                        <td className={`team-name-cell ${team.isFavorite ? 'favorite' : ''}`}>
                          <div className="team-info">
                            {getTeamLogo(team.team) && (
                              <img src={getTeamLogo(team.team)} alt={team.team} className="team-logo" />
                            )}
                            <span
                              className="clickable"
                              onClick={() => handleTeamClick(team.team)}
                            >
                              {team.team}
                            </span>
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
            )}
          </div>
        </div>
      )}

      <div className="info-box">
        <p><strong>Note:</strong> {selectedSport === 'nhl' ? 'NHL standings are live from the official NHL API! Click on any team name to see player stats.' : 'NFL standings are live from the ESPN API!'}</p>
      </div>

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

export default Standings;
