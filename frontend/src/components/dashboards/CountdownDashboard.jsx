import { useState, useEffect } from 'react';
import './CountdownDashboard.css';

function CountdownDashboard({ preferences, activeCountdown, onNavigate }) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  const [stats, setStats] = useState({
    weeks: 0,
    totalHours: 0
  });

  // Get all countdown events and current index
  const allCountdowns = preferences?.countdownEvents?.length > 0
    ? preferences.countdownEvents
    : [preferences?.countdownEvent || { name: 'New Year', date: '2026-01-01' }];

  const currentIndex = activeCountdown
    ? allCountdowns.findIndex(e => e.id === activeCountdown)
    : 0;

  const actualIndex = currentIndex >= 0 ? currentIndex : 0;
  const countdownEvent = allCountdowns[actualIndex];
  const hasMultiple = allCountdowns.length > 1;

  // Navigation handlers
  const handlePrevious = () => {
    if (!hasMultiple || !onNavigate) return;
    const newIndex = actualIndex === 0 ? allCountdowns.length - 1 : actualIndex - 1;
    onNavigate(allCountdowns[newIndex].id);
  };

  const handleNext = () => {
    if (!hasMultiple || !onNavigate) return;
    const newIndex = (actualIndex + 1) % allCountdowns.length;
    onNavigate(allCountdowns[newIndex].id);
  };

  const handleDotClick = (index) => {
    if (!onNavigate) return;
    onNavigate(allCountdowns[index].id);
  };

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const eventDate = new Date(countdownEvent.date).getTime();
      const difference = eventDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Calculate additional stats
        const totalHours = Math.floor(difference / (1000 * 60 * 60));
        const weeks = Math.floor(days / 7);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          total: difference
        });

        setStats({
          weeks,
          totalHours
        });
      } else {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        });

        setStats({
          weeks: 0,
          totalHours: 0
        });
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [countdownEvent.date]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get dynamic theme based on days remaining
  const getTheme = () => {
    const { days } = timeRemaining;
    if (days > 90) return 'far'; // Blue-purple gradient
    if (days > 30) return 'approaching'; // Orange gradient
    if (days > 7) return 'soon'; // Red-orange gradient
    return 'imminent'; // Red gradient
  };

  // Format alternative time displays
  const getAlternativeTimeDisplay = () => {
    const { weeks } = stats;
    const remainingDays = timeRemaining.days % 7;

    if (weeks > 0) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}${remainingDays > 0 ? ` and ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}` : ''}`;
    }
    return `${timeRemaining.days} ${timeRemaining.days === 1 ? 'day' : 'days'}`;
  };

  const isPast = timeRemaining.total <= 0;
  const theme = getTheme();

  return (
    <div className={`countdown-dashboard theme-${theme}`}>
      {hasMultiple && (
        <>
          <button className="countdown-nav-button countdown-nav-previous" onClick={handlePrevious}>
            ‹
          </button>
          <button className="countdown-nav-button countdown-nav-next" onClick={handleNext}>
            ›
          </button>
        </>
      )}

      <div className="countdown-container">
        <h1 className="event-name">{countdownEvent.name}</h1>
        <div className="event-date">{formatDate(countdownEvent.date)}</div>

        {isPast ? (
          <div className="event-passed">
            <div className="celebration-container">
              <div className="passed-icon">🎉</div>
              <div className="confetti">🎊</div>
              <div className="confetti">🎈</div>
              <div className="confetti">✨</div>
            </div>
            <h2>This event has arrived!</h2>
            <p className="celebration-text">The moment you've been waiting for is here!</p>
            <p className="settings-hint">Go to Admin Panel to manage countdown events.</p>
          </div>
        ) : (
          <>
            {/* Stats Panel */}
            <div className="stats-panel">
              <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <div className="stat-value">{getAlternativeTimeDisplay()}</div>
                  <div className="stat-label">Time Remaining</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalHours.toLocaleString()}</div>
                  <div className="stat-label">Total Hours</div>
                </div>
              </div>
            </div>

            {/* Main Countdown Grid */}
            <div className="countdown-grid">
              <div className="countdown-box">
                <div className="countdown-number">{timeRemaining.days}</div>
                <div className="countdown-label">Days</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{timeRemaining.hours}</div>
                <div className="countdown-label">Hours</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{timeRemaining.minutes}</div>
                <div className="countdown-label">Minutes</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{timeRemaining.seconds}</div>
                <div className="countdown-label">Seconds</div>
              </div>
            </div>
          </>
        )}

        {hasMultiple && (
          <div className="countdown-indicators">
            {allCountdowns.map((countdown, index) => (
              <button
                key={countdown.id || index}
                className={`indicator-dot ${index === actualIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
                title={countdown.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CountdownDashboard;
