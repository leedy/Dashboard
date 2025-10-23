import { useState, useEffect } from 'react';
import './CountdownDashboard.css';

function CountdownDashboard({ preferences }) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  const countdownEvent = preferences?.countdownEvent || {
    name: 'New Year',
    date: '2026-01-01'
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

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          total: difference
        });
      } else {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
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

  const isPast = timeRemaining.total <= 0;

  return (
    <div className="countdown-dashboard">
      <div className="countdown-container">
        <h1 className="event-name">{countdownEvent.name}</h1>
        <div className="event-date">{formatDate(countdownEvent.date)}</div>

        {isPast ? (
          <div className="event-passed">
            <div className="passed-icon">🎉</div>
            <h2>This event has passed!</h2>
            <p>Go to Settings to set a new countdown event.</p>
          </div>
        ) : (
          <>
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

            <div className="countdown-summary">
              <p>
                <strong>{timeRemaining.days}</strong> {timeRemaining.days === 1 ? 'day' : 'days'} until {countdownEvent.name}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CountdownDashboard;
