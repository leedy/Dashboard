import { useState, useEffect } from 'react';
import axios from 'axios';
import './WeatherDashboard.css';

function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Location for zipcode 17042 (Lebanon, PA)
  const location = {
    name: 'Lebanon, PA',
    zipcode: '17042',
    latitude: 40.34093,
    longitude: -76.41135
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current weather and forecast from Open-Meteo API
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
          hourly: 'temperature_2m,weather_code,precipitation_probability',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
          temperature_unit: 'fahrenheit',
          wind_speed_unit: 'mph',
          precipitation_unit: 'inch',
          timezone: 'America/New_York',
          forecast_days: 7
        }
      });

      setWeatherData(response.data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  // Get weather description from WMO code
  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  };

  // Get weather icon based on WMO code
  const getWeatherIcon = (code) => {
    const iconMap = {
      0: '☀️',
      1: '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌦️',
      55: '🌧️',
      61: '🌧️',
      63: '🌧️',
      65: '⛈️',
      71: '🌨️',
      73: '🌨️',
      75: '❄️',
      77: '❄️',
      80: '🌦️',
      81: '🌧️',
      82: '⛈️',
      85: '🌨️',
      86: '❄️',
      95: '⛈️',
      96: '⛈️',
      99: '⛈️'
    };
    return iconMap[code] || '🌡️';
  };

  // Get wind direction
  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className="weather-dashboard">
        <div className="loading-container">
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-dashboard">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const current = weatherData.current;
  const daily = weatherData.daily;

  return (
    <div className="weather-dashboard">
      <div className="weather-header">
        <h2>Weather Forecast</h2>
        <div className="location-info">
          <span className="location-name">{location.name}</span>
          <span className="zipcode">{location.zipcode}</span>
        </div>
      </div>

      {/* Current Weather Card */}
      <div className="current-weather-card">
        <div className="current-weather-main">
          <div className="weather-icon-large">
            {getWeatherIcon(current.weather_code)}
          </div>
          <div className="current-temp-section">
            <div className="current-temp">{Math.round(current.temperature_2m)}°F</div>
            <div className="weather-description">{getWeatherDescription(current.weather_code)}</div>
            <div className="feels-like">Feels like {Math.round(current.apparent_temperature)}°F</div>
          </div>
        </div>

        <div className="current-weather-details">
          <div className="detail-item">
            <span className="detail-label">Humidity</span>
            <span className="detail-value">{current.relative_humidity_2m}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Wind</span>
            <span className="detail-value">
              {Math.round(current.wind_speed_10m)} mph {getWindDirection(current.wind_direction_10m)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">High / Low</span>
            <span className="detail-value">
              {Math.round(daily.temperature_2m_max[0])}° / {Math.round(daily.temperature_2m_min[0])}°
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="forecast-section">
        <h3>7-Day Forecast</h3>
        <div className="forecast-grid">
          {daily.time.map((date, index) => (
            <div key={index} className="forecast-day-card">
              <div className="forecast-day">{formatDayOfWeek(date)}</div>
              <div className="forecast-date">{formatDate(date)}</div>
              <div className="forecast-icon">{getWeatherIcon(daily.weather_code[index])}</div>
              <div className="forecast-temps">
                <span className="temp-high">{Math.round(daily.temperature_2m_max[index])}°</span>
                <span className="temp-separator">/</span>
                <span className="temp-low">{Math.round(daily.temperature_2m_min[index])}°</span>
              </div>
              <div className="forecast-precipitation">
                💧 {daily.precipitation_probability_max[index]}%
              </div>
              <div className="forecast-wind">
                💨 {Math.round(daily.wind_speed_10m_max[index])} mph
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="weather-footer">
        <p>Powered by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a></p>
      </div>
    </div>
  );
}

export default WeatherDashboard;
