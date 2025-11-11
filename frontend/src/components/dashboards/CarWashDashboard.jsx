import { useState, useEffect } from 'react';
import axios from 'axios';
import './CarWashDashboard.css';

function CarWashDashboard({ preferences }) {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get location from preferences with fallback to Lebanon, PA
  const location = preferences?.weatherLocation || {
    name: 'Lebanon, PA',
    zipcode: '17042',
    latitude: 40.34093,
    longitude: -76.41135
  };

  useEffect(() => {
    fetchForecast();
  }, [location.zipcode]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
          temperature_unit: 'fahrenheit',
          precipitation_unit: 'inch',
          timezone: 'America/New_York',
          forecast_days: 7
        }
      });

      setForecastData(response.data);
    } catch (err) {
      console.error('Error fetching forecast data:', err);
      setError('Failed to load weather forecast');
    } finally {
      setLoading(false);
    }
  };

  // Check if it's a good day to wash the car
  const getCarWashRecommendation = () => {
    if (!forecastData?.daily) return null;

    // Check next 6 days (skip today, check days 1-6)
    const next6Days = forecastData.daily.precipitation_probability_max.slice(1, 7);

    // If any day has >30% chance of rain, it's a BAD day to wash
    const willRain = next6Days.some(prob => prob > 30);

    return {
      isGoodDay: !willRain,
      reason: willRain
        ? 'Rain is forecasted in the next 6 days. Don\'t wash - it\'ll just get dirty!'
        : 'No rain expected for the next 6 days. Great day to wash your car!'
    };
  };

  const getWeatherIcon = (code) => {
    const weatherIcons = {
      0: '☀️',
      1: '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌧️',
      55: '🌧️',
      61: '🌧️',
      63: '🌧️',
      65: '⛈️',
      71: '🌨️',
      73: '🌨️',
      75: '❄️',
      77: '🌨️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      85: '🌨️',
      86: '❄️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️'
    };
    return weatherIcons[code] || '🌤️';
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className="carwash-dashboard">
        <div className="carwash-container">
          <div className="loading">Loading forecast...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carwash-dashboard">
        <div className="carwash-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  const recommendation = getCarWashRecommendation();

  return (
    <div className={`carwash-dashboard ${recommendation?.isGoodDay ? 'good-day' : 'bad-day'}`}>
      <div className="carwash-container">
        <h1 className="carwash-title">Bob's Car Wash</h1>
        <div className="location-info">{location.city || location.name}</div>

        {recommendation && (
          <div className="recommendation-card">
            <div className="recommendation-icon">
              {recommendation.isGoodDay ? '✅' : '❌'}
            </div>
            <h2 className="recommendation-verdict">
              {recommendation.isGoodDay ? 'GOOD DAY' : 'BAD DAY'}
            </h2>
            <p className="recommendation-reason">{recommendation.reason}</p>
          </div>
        )}

        <div className="forecast-section">
          <h3>Next 6 Days Forecast</h3>
          <div className="forecast-grid">
            {forecastData?.daily?.time.slice(1, 7).map((date, index) => {
              const actualIndex = index + 1;
              return (
                <div key={date} className="forecast-day">
                  <div className="day-name">{getDayName(date)}</div>
                  <div className="weather-icon">
                    {getWeatherIcon(forecastData.daily.weather_code[actualIndex])}
                  </div>
                  <div className="temp-range">
                    <span className="temp-high">
                      {Math.round(forecastData.daily.temperature_2m_max[actualIndex])}°
                    </span>
                    <span className="temp-low">
                      {Math.round(forecastData.daily.temperature_2m_min[actualIndex])}°
                    </span>
                  </div>
                  <div className="rain-prob">
                    <span className={forecastData.daily.precipitation_probability_max[actualIndex] > 30 ? 'high-rain' : ''}>
                      💧 {forecastData.daily.precipitation_probability_max[actualIndex]}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="info-note">
          <strong>How it works:</strong> If rain is expected within the next 6 days, it's a bad day to wash - your car will just get dirty again.
          If no rain is forecasted, it's a great day to wash and keep your car clean!
        </div>
      </div>
    </div>
  );
}

export default CarWashDashboard;
