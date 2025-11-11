import { useState, useEffect } from 'react';
import axios from 'axios';
import './FlyersNews.css';

function FlyersNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchNews();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchNews();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/news/flyers');
      setArticles(response.data.articles);
      setLastUpdated(new Date(response.data.lastUpdated));
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
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

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flyers-news">
        <div className="news-header">
          <h2>Philadelphia Flyers News</h2>
        </div>
        <div className="loading-container">
          <p>Loading news...</p>
        </div>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="flyers-news">
        <div className="news-header">
          <h2>Philadelphia Flyers News</h2>
        </div>
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchNews} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flyers-news">
      <div className="news-header">
        <div className="header-content">
          <h2>Philadelphia Flyers News</h2>
          {lastUpdated && (
            <p className="last-updated">Last updated: {formatLastUpdated()}</p>
          )}
        </div>
        <button onClick={fetchNews} className="refresh-button" disabled={loading}>
          {loading ? '↻ Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div className="news-grid">
        {articles.map((article, index) => (
          <a
            key={index}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            <div className="news-card-content">
              <div className="news-meta">
                <span className="news-source">{article.source}</span>
                <span className="news-date">{formatDate(article.pubDate)}</span>
              </div>
              <h3 className="news-title">{article.title}</h3>
              {article.description && (
                <p className="news-description">{article.description}</p>
              )}
            </div>
            <div className="news-card-footer">
              <span className="read-more">Read more →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default FlyersNews;
