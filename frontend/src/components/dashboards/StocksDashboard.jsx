import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './StocksDashboard.css';

// Polling intervals based on market state (matching backend cache durations)
const POLL_INTERVALS = {
  REGULAR: 5 * 60 * 1000,      // 5 minutes during market hours
  PRE: 15 * 60 * 1000,         // 15 minutes during pre-market
  POST: 15 * 60 * 1000,        // 15 minutes during after-hours
  CLOSED: 60 * 60 * 1000       // 1 hour when market is closed
};

function StocksDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  // Get polling interval based on market state
  const getPollInterval = (marketState) => {
    return POLL_INTERVALS[marketState] || POLL_INTERVALS.CLOSED;
  };

  useEffect(() => {
    fetchQuotes();

    // Start with default interval, will be adjusted after first fetch
    intervalRef.current = setInterval(fetchQuotes, POLL_INTERVALS.CLOSED);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchQuotes = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/stocks/quotes');
      setQuotes(response.data);
      setLastUpdate(new Date());
      setLoading(false);

      // Adjust polling interval based on market state
      const marketState = response.data[0]?.marketState || 'CLOSED';
      const newInterval = getPollInterval(marketState);

      // Update interval if it changed
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(fetchQuotes, newInterval);
      }
    } catch (err) {
      console.error('Error fetching stock quotes:', err);
      setError('Failed to load market data');
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatChange = (change) => {
    if (change === null || change === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPercent = (percent) => {
    if (percent === null || percent === undefined) return 'N/A';
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getMarketStatusText = (marketState) => {
    switch (marketState) {
      case 'REGULAR':
        return '🟢 Market Open';
      case 'CLOSED':
        return '🔴 Market Closed';
      case 'PRE':
        return '🟡 Pre-Market';
      case 'POST':
        return '🟡 After Hours';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="stocks-dashboard">
        <div className="stocks-container">
          <div className="loading">Loading market data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stocks-dashboard">
        <div className="stocks-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  // Check if we have any valid quotes
  const hasValidData = quotes.some(q => q.price !== null);
  const marketState = quotes[0]?.marketState || 'UNKNOWN';

  return (
    <div className="stocks-dashboard">
      <div className="stocks-container">
        <div className="stocks-header">
          <h1 className="stocks-title">Market Overview</h1>
          {hasValidData && (
            <div className="market-status">
              <span className="status-text">{getMarketStatusText(marketState)}</span>
              {lastUpdate && (
                <span className="last-update">
                  Updated: {lastUpdate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="indices-grid">
          {quotes.map((quote) => {
            const isPositive = quote.change >= 0;
            const changeClass = quote.change === null ? 'neutral' : isPositive ? 'positive' : 'negative';

            return (
              <div key={quote.symbol} className={`index-card ${changeClass}`}>
                <div className="index-header">
                  <h2 className="index-name">{quote.name}</h2>
                  <span className="index-symbol">{quote.symbol}</span>
                </div>

                <div className="index-price">
                  {formatPrice(quote.price)}
                </div>

                <div className="index-change">
                  <span className="change-value">
                    {formatChange(quote.change)}
                  </span>
                  <span className="change-percent">
                    ({formatPercent(quote.changePercent)})
                  </span>
                </div>

                {quote.error && (
                  <div className="quote-error">{quote.error}</div>
                )}
              </div>
            );
          })}
        </div>

        {!hasValidData && (
          <div className="no-data-message">
            Market data is currently unavailable. Please try again later.
          </div>
        )}
      </div>
    </div>
  );
}

export default StocksDashboard;
