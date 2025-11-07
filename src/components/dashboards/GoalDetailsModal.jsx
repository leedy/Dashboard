import { useState, useEffect } from 'react';
import axios from 'axios';
import './GoalDetailsModal.css';

function GoalDetailsModal({ gameId, homeTeam, awayTeam, onClose }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGoalDetails();
  }, [gameId]);

  const fetchGoalDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch game details from NHL API
      const response = await axios.get(`/api/nhl/v1/gamecenter/${gameId}/landing`);
      const gameData = response.data;

      // Extract scoring plays
      const scoringPlays = gameData.summary?.scoring || [];

      // Flatten goals from all periods
      const allGoals = [];
      scoringPlays.forEach((period) => {
        if (period.goals && period.goals.length > 0) {
          period.goals.forEach((goal) => {
            allGoals.push({
              period: period.periodDescriptor?.number || 'N/A',
              periodType: period.periodDescriptor?.periodType || 'REG',
              timeInPeriod: goal.timeInPeriod || '',
              team: goal.teamAbbrev?.default || goal.teamAbbrev,
              scorerName: goal.name?.default || goal.firstName?.default + ' ' + goal.lastName?.default,
              scorerFirstName: goal.firstName?.default || '',
              scorerLastName: goal.lastName?.default || '',
              scorerSeasonGoals: goal.goalsToDate || null,
              strength: goal.strength || 'EV',
              assists: goal.assists || [],
              highlightClip: goal.highlightClip || null
            });
          });
        }
      });

      setGoals(allGoals);
    } catch (err) {
      console.error('Error fetching goal details:', err);
      setError('Failed to load goal details');
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period, periodType) => {
    if (periodType === 'OT') return 'OT';
    if (periodType === 'SO') return 'SO';
    if (period === 1) return '1st Period';
    if (period === 2) return '2nd Period';
    if (period === 3) return '3rd Period';
    return `Period ${period}`;
  };

  const formatStrength = (strength) => {
    const upperStrength = strength?.toUpperCase();
    if (upperStrength === 'EV') return 'Even Strength';
    if (upperStrength === 'PP') return 'Power Play';
    if (upperStrength === 'SH') return 'Short Handed';
    if (upperStrength === 'EN') return 'Empty Net';
    return strength;
  };

  return (
    <div className="goal-modal-overlay" onClick={onClose}>
      <div className="goal-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="goal-modal-header">
          <h2>Goal Summary</h2>
          <button className="goal-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="goal-modal-matchup">
          <span>{awayTeam}</span>
          <span className="vs-text">@</span>
          <span>{homeTeam}</span>
        </div>

        <div className="goal-modal-body">
          {loading ? (
            <div className="goal-modal-loading">Loading goal details...</div>
          ) : error ? (
            <div className="goal-modal-error">{error}</div>
          ) : goals.length === 0 ? (
            <div className="goal-modal-no-goals">No goals scored yet</div>
          ) : (
            <div className="goals-list">
              {goals.map((goal, index) => (
                <div key={index} className="goal-item">
                  <div className="goal-header">
                    <div className="goal-period">
                      {formatPeriod(goal.period, goal.periodType)} - {goal.timeInPeriod}
                    </div>
                    <div className="goal-team">{goal.team}</div>
                  </div>

                  <div className="goal-scorer">
                    <span className="goal-icon">🚨</span>
                    <span className="scorer-name">
                      {goal.scorerName || `${goal.scorerFirstName} ${goal.scorerLastName}`}
                      {goal.scorerSeasonGoals !== null && (
                        <span className="season-total"> ({goal.scorerSeasonGoals})</span>
                      )}
                    </span>
                    {goal.strength && goal.strength.toUpperCase() !== 'EV' && (
                      <span className="goal-strength">({formatStrength(goal.strength)})</span>
                    )}
                  </div>

                  {goal.assists && goal.assists.length > 0 && (
                    <div className="goal-assists">
                      <span className="assists-label">Assists:</span>
                      {goal.assists.map((assist, idx) => (
                        <span key={idx} className="assist-name">
                          {assist.name?.default || `${assist.firstName?.default} ${assist.lastName?.default}`}
                          {assist.assistsToDate !== null && assist.assistsToDate !== undefined && (
                            <span className="season-total"> ({assist.assistsToDate})</span>
                          )}
                          {idx < goal.assists.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoalDetailsModal;
