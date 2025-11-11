import { useState, useEffect } from 'react';
import axios from 'axios';
import './CountdownManagement.css';

function CountdownManagement({ preferences, onSave }) {
  const [countdowns, setCountdowns] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCountdown, setNewCountdown] = useState({ name: '', date: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (preferences?.countdownEvents) {
      setCountdowns(preferences.countdownEvents);
    }
  }, [preferences]);

  const handleAddCountdown = () => {
    if (!newCountdown.name.trim()) {
      setError('Please enter an event name');
      return;
    }

    if (!newCountdown.date) {
      setError('Please select a date');
      return;
    }

    const id = `countdown-${Date.now()}`;
    const countdown = {
      id,
      name: newCountdown.name.trim(),
      date: newCountdown.date,
      createdAt: new Date()
    };

    const updatedCountdowns = [...countdowns, countdown];
    const updatedPrefs = {
      ...preferences,
      countdownEvents: updatedCountdowns
    };

    setCountdowns(updatedCountdowns);
    onSave(updatedPrefs);
    setNewCountdown({ name: '', date: '' });
    setShowAddForm(false);
    setError('');
  };

  const handleDeleteCountdown = (id) => {
    const updatedCountdowns = countdowns.filter(c => c.id !== id);
    const updatedPrefs = {
      ...preferences,
      countdownEvents: updatedCountdowns
    };

    setCountdowns(updatedCountdowns);
    onSave(updatedPrefs);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (dateString) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const difference = eventDate - now;
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="countdown-management">
      <div className="management-header">
        <h2>Countdown Management</h2>
        <p className="management-subtitle">
          Create and manage multiple countdown events. Each countdown will appear as a separate page in rotation.
        </p>
      </div>

      <div className="countdowns-list">
        {countdowns.length === 0 ? (
          <div className="no-countdowns">
            <div className="empty-icon">⏱️</div>
            <p>No countdown events yet</p>
            <small>Click "Add Countdown" to create your first event</small>
          </div>
        ) : (
          countdowns
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(countdown => {
              const daysRemaining = getDaysRemaining(countdown.date);
              const isPast = daysRemaining < 0;

              return (
                <div key={countdown.id} className={`countdown-card ${isPast ? 'past' : ''}`}>
                  <div className="countdown-card-header">
                    <h3>{countdown.name}</h3>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteCountdown(countdown.id)}
                      title="Delete countdown"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="countdown-card-body">
                    <div className="countdown-info">
                      <div className="info-label">Date</div>
                      <div className="info-value">{formatDate(countdown.date)}</div>
                    </div>
                    <div className="countdown-info">
                      <div className="info-label">Status</div>
                      <div className="info-value">
                        {isPast ? (
                          <span className="status-past">🎉 Event Passed</span>
                        ) : daysRemaining === 0 ? (
                          <span className="status-today">🎊 Today!</span>
                        ) : (
                          <span className="status-upcoming">
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {showAddForm ? (
        <div className="add-countdown-form">
          <h3>Add New Countdown</h3>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="event-name">Event Name</label>
            <input
              id="event-name"
              type="text"
              value={newCountdown.name}
              onChange={(e) => setNewCountdown({ ...newCountdown, name: e.target.value })}
              placeholder="Enter event name (e.g., Summer Vacation)"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-date">Event Date</label>
            <input
              id="event-date"
              type="date"
              value={newCountdown.date}
              onChange={(e) => setNewCountdown({ ...newCountdown, date: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button className="save-button" onClick={handleAddCountdown}>
              Add Countdown
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setShowAddForm(false);
                setNewCountdown({ name: '', date: '' });
                setError('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="add-countdown-button" onClick={() => setShowAddForm(true)}>
          ➕ Add Countdown
        </button>
      )}

      <div className="management-note">
        <strong>Note:</strong> When you have multiple countdowns, they will automatically rotate during auto-rotation.
        The countdown dashboard will cycle through each event one at a time.
      </div>
    </div>
  );
}

export default CountdownManagement;
