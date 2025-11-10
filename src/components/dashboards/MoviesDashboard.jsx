import { useState, useEffect } from 'react';
import axios from 'axios';
import './MoviesDashboard.css';

function MoviesDashboard({ preferences }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use API key from preferences first, fall back to environment variable
  const TMDB_API_KEY = preferences?.tmdbApiKey || import.meta.env.VITE_TMDB_API_KEY;
  const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

  useEffect(() => {
    fetchUpcomingMovies();
  }, [preferences?.tmdbApiKey]);

  const fetchUpcomingMovies = async () => {
    if (!TMDB_API_KEY) {
      setError('TMDb API key not configured. Please add your API key in the Admin panel.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.themoviedb.org/3/movie/upcoming', {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          page: 1,
          region: 'US'
        }
      });

      // Filter to movies releasing in the next 30 days
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const filteredMovies = response.data.results.filter(movie => {
        if (!movie.release_date) return false;
        const releaseDate = new Date(movie.release_date);
        return releaseDate >= today && releaseDate <= thirtyDaysFromNow;
      });

      // Sort by release date (earliest first)
      filteredMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

      setMovies(filteredMovies);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      setError('Failed to load upcoming movies. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatReleaseDate = (dateString) => {
    if (!dateString) return 'Release date TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  };

  return (
    <div className="movies-dashboard">
      <div className="dashboard-header">
        <h2>Coming Soon to Theaters</h2>
        <p className="subtitle">Movies releasing in the next 30 days</p>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-box">
            <h3>⚠️ Configuration Required</h3>
            <p>{error}</p>
            <div className="setup-instructions">
              <h4>Setup Instructions:</h4>
              <ol>
                <li>Sign up for a free account at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer">themoviedb.org</a></li>
                <li>Get your API key from <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer">Account Settings → API</a></li>
                <li>Go to the <strong>Admin Panel</strong> in the dashboard navigation</li>
                <li>Scroll to the <strong>API Keys</strong> section</li>
                <li>Paste your TMDb API key and it will auto-save</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <p>Loading upcoming movies...</p>
        </div>
      ) : !error && movies.length > 0 ? (
        <div className="movies-grid">
          {movies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="movie-poster-container">
                {getPosterUrl(movie.poster_path) ? (
                  <img
                    src={getPosterUrl(movie.poster_path)}
                    alt={movie.title}
                    className="movie-poster"
                    loading="lazy"
                  />
                ) : (
                  <div className="no-poster">
                    <span>🎬</span>
                    <p>No Poster</p>
                  </div>
                )}
                <div className="movie-overlay">
                  <h3 className="movie-title">{movie.title}</h3>
                </div>
              </div>
              <div className="movie-info">
                <h3 className="movie-title-main">{movie.title}</h3>
                <p className="release-date-main">{formatReleaseDate(movie.release_date)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : !error && movies.length === 0 ? (
        <div className="no-data">
          <p>No movies found releasing in the next 30 days.</p>
        </div>
      ) : null}

      <div className="info-box">
        <p>
          Movie data provided by <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">The Movie Database (TMDb)</a>
        </p>
      </div>
    </div>
  );
}

export default MoviesDashboard;
