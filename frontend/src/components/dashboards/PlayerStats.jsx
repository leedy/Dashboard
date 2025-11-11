import { useState, useEffect } from 'react';
import axios from 'axios';
import './PlayerStats.css';

function PlayerStats({ teamAbbrev, teamName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [skaters, setSkaters] = useState([]);
  const [goalies, setGoalies] = useState([]);

  // Convert seconds to MM:SS format
  const formatTOI = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/nhl/v1/club-stats/${teamAbbrev}/now`);

        // Sort skaters by points (descending)
        const skatersData = response.data.skaters || [];
        const sortedSkaters = skatersData.sort((a, b) => b.points - a.points);

        // Sort goalies by wins (descending)
        const goaliesData = response.data.goalies || [];
        const sortedGoalies = goaliesData.sort((a, b) => b.wins - a.wins);

        setSkaters(sortedSkaters);
        setGoalies(sortedGoalies);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching player stats:', error);
        setLoading(false);
      }
    };

    if (teamAbbrev) {
      fetchPlayerStats();
    }
  }, [teamAbbrev]);

  const handleOverlayClick = (e) => {
    // Close if clicking the overlay background (not the content)
    if (e.target.className === 'player-stats-overlay') {
      onClose();
    }
  };

  return (
    <div className="player-stats-overlay" onClick={handleOverlayClick}>
      <div className="player-stats-modal">
        <div className="modal-header">
          <h2>{teamName} - Player Stats</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading-stats">Loading player stats...</div>
        ) : (
          <div className="stats-content">
            {/* Skaters Section */}
            <div className="stats-section">
              <h3>Skaters</h3>
              <div className="stats-table-wrapper">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>GP</th>
                      <th>G</th>
                      <th>A</th>
                      <th>PTS</th>
                      <th>+/-</th>
                      <th>PIM</th>
                      <th>TOI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skaters.map((player, index) => (
                      <tr key={index}>
                        <td className="player-name">
                          {player.firstName?.default} {player.lastName?.default}
                        </td>
                        <td>{player.gamesPlayed || 0}</td>
                        <td>{player.goals || 0}</td>
                        <td>{player.assists || 0}</td>
                        <td className="points-highlight">{player.points || 0}</td>
                        <td className={player.plusMinus >= 0 ? 'positive' : 'negative'}>
                          {player.plusMinus > 0 ? '+' : ''}{player.plusMinus || 0}
                        </td>
                        <td>{player.penaltyMinutes || 0}</td>
                        <td>{formatTOI(player.avgTimeOnIcePerGame)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Goalies Section */}
            {goalies.length > 0 && (
              <div className="stats-section">
                <h3>Goalies</h3>
                <div className="stats-table-wrapper">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>GP</th>
                        <th>W</th>
                        <th>L</th>
                        <th>OT</th>
                        <th>GAA</th>
                        <th>SV%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goalies.map((player, index) => (
                        <tr key={index}>
                          <td className="player-name">
                            {player.firstName?.default} {player.lastName?.default}
                          </td>
                          <td>{player.gamesPlayed || 0}</td>
                          <td>{player.wins || 0}</td>
                          <td>{player.losses || 0}</td>
                          <td>{player.otLosses || 0}</td>
                          <td>{player.goalsAgainstAvg ? player.goalsAgainstAvg.toFixed(2) : '0.00'}</td>
                          <td>{player.savePctg ? player.savePctg.toFixed(3) : '.000'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerStats;
