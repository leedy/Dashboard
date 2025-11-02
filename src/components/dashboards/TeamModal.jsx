import { useState, useEffect } from 'react';
import axios from 'axios';
import './TeamModal.css';

function TeamModal({ teamAbbrev, teamName, onClose }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  // Player stats state
  const [skaters, setSkaters] = useState([]);
  const [goalies, setGoalies] = useState([]);

  // News state
  const [articles, setArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // Convert seconds to MM:SS format
  const formatTOI = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch player stats
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

  // Fetch team news when news tab is active
  useEffect(() => {
    if (activeTab === 'news' && articles.length === 0) {
      fetchTeamNews();
    }
  }, [activeTab]);

  const fetchTeamNews = async () => {
    try {
      setNewsLoading(true);
      const response = await axios.get(`/api/news/team/${encodeURIComponent(teamName)}`);
      setArticles(response.data.articles);
      setNewsLoading(false);
    } catch (error) {
      console.error('Error fetching team news:', error);
      setNewsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleOverlayClick = (e) => {
    // Close if clicking the overlay background (not the content)
    if (e.target.className === 'team-modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="team-modal-overlay" onClick={handleOverlayClick}>
      <div className="team-modal">
        <div className="modal-header">
          <h2>{teamName}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Player Stats
          </button>
          <button
            className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            Team News
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-content">
          {activeTab === 'stats' && (
            <div className="stats-tab">
              {loading ? (
                <div className="loading-content">Loading player stats...</div>
              ) : (
                <>
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
                            <th>SO</th>
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
                              <td>{player.goalsAgainstAverage?.toFixed(2) || '0.00'}</td>
                              <td>{player.savePctg?.toFixed(3) || '.000'}</td>
                              <td>{player.shutouts || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'news' && (
            <div className="news-tab">
              {newsLoading ? (
                <div className="loading-content">Loading team news...</div>
              ) : (
                <div className="news-list">
                  {articles.length === 0 ? (
                    <div className="no-news">No recent news found for {teamName}</div>
                  ) : (
                    articles.map((article, index) => (
                      <a
                        key={index}
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-item"
                      >
                        <div className="news-item-header">
                          <span className="news-date">{formatDate(article.pubDate)}</span>
                        </div>
                        <h4 className="news-title">{article.title}</h4>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamModal;
