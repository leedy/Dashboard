import { useState, useEffect } from 'react';
import axios from 'axios';
import './WeatherDashboard.css';

function WeatherDashboard({ preferences }) {
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
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
    fetchWeatherData();
  }, [location.zipcode]); // Re-fetch when zipcode changes

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch current weather and forecast from Open-Meteo API
      const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day',
          hourly: 'temperature_2m,weather_code,precipitation_probability',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
          temperature_unit: 'fahrenheit',
          wind_speed_unit: 'mph',
          precipitation_unit: 'inch',
          timezone: 'America/New_York',
          forecast_days: 7
        }
      });

      // Fetch air quality data from Open-Meteo Air Quality API
      const airQualityResponse = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          current: 'us_aqi',
          hourly: 'us_aqi',
          timezone: 'America/New_York',
          forecast_days: 7
        }
      });

      setWeatherData(weatherResponse.data);
      setAirQualityData(airQualityResponse.data);
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

  // Calculate moon phase based on date (simplified algorithm)
  const calculateMoonPhase = (date = new Date()) => {
    // Known new moon: January 6, 2000
    const knownNewMoon = new Date(2000, 0, 6, 18, 14);
    const lunarCycle = 29.53058867; // days

    const currentDate = typeof date === 'string' ? new Date(date) : date;
    const daysSinceKnownNewMoon = (currentDate - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentPhase = (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;

    return currentPhase;
  };

  // Get moon phase icon based on moon phase value (0-1)
  const getMoonPhaseIcon = (moonPhase) => {
    if (moonPhase === null || moonPhase === undefined) return '🌙';

    // Moon phase: 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
    if (moonPhase < 0.0625) return '🌑';  // New Moon
    if (moonPhase < 0.1875) return '🌒';  // Waxing Crescent
    if (moonPhase < 0.3125) return '🌓';  // First Quarter
    if (moonPhase < 0.4375) return '🌔';  // Waxing Gibbous
    if (moonPhase < 0.5625) return '🌕';  // Full Moon
    if (moonPhase < 0.6875) return '🌖';  // Waning Gibbous
    if (moonPhase < 0.8125) return '🌗';  // Last Quarter
    if (moonPhase < 0.9375) return '🌘';  // Waning Crescent
    return '🌑';  // New Moon
  };

  // Get weather icon based on WMO code and day/night
  const getWeatherIcon = (code, isDay = true, moonPhase = null) => {
    // Night icons for clear/partly cloudy conditions - show moon phase
    if (!isDay) {
      const nightIconMap = {
        0: getMoonPhaseIcon(moonPhase),  // Clear night - show moon phase
        1: getMoonPhaseIcon(moonPhase),  // Mainly clear night - show moon phase
        2: '☁️',  // Partly cloudy night
        3: '☁️',  // Overcast (same as day)
      };
      if (nightIconMap[code]) return nightIconMap[code];
    }

    // Day icons or weather conditions that look the same day/night
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

  // Get AQI category and color
  const getAQIInfo = (aqi) => {
    if (aqi === null || aqi === undefined) return { label: 'N/A', color: '#999' };
    if (aqi <= 50) return { label: 'Good', color: '#00e400' };
    if (aqi <= 100) return { label: 'Moderate', color: '#ffff00' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#ff7e00' };
    if (aqi <= 200) return { label: 'Unhealthy', color: '#ff0000' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8f3f97' };
    return { label: 'Hazardous', color: '#7e0023' };
  };

  // Get daily AQI (max for the day from hourly data)
  const getDailyAQI = (dayIndex) => {
    if (!airQualityData || !airQualityData.hourly) return null;

    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    const dayHours = airQualityData.hourly.us_aqi.slice(startHour, endHour);
    const validHours = dayHours.filter(v => v !== null && v !== undefined && !isNaN(v));

    // Return null if no valid data
    if (validHours.length === 0) return null;

    return Math.max(...validHours);
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
  const currentAQI = airQualityData?.current?.us_aqi;
  const currentAQIInfo = getAQIInfo(currentAQI);

  return (
    <div className="weather-dashboard">
      <div className="weather-header">
        <div className="location-info">
          <span className="location-name">{location.city || location.name}</span>
        </div>
      </div>

      <div className="weather-content">
        {/* Current Weather Card - Left Side */}
        <div className="current-weather-card">
          <div className="weather-icon-large">
            {getWeatherIcon(current.weather_code, current.is_day === 1, calculateMoonPhase())}
          </div>
          <div className="current-temp">{Math.round(current.temperature_2m)}°</div>
          <div className="weather-description">{getWeatherDescription(current.weather_code)}</div>
          <div className="feels-like">Feels like {Math.round(current.apparent_temperature)}°</div>

          <div className="current-weather-details">
            <div className="detail-item">
              <span className="detail-icon">💧</span>
              <span className="detail-value">{current.relative_humidity_2m}%</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">💨</span>
              <span className="detail-value">
                {Math.round(current.wind_speed_10m)} mph {getWindDirection(current.wind_direction_10m)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🌡️</span>
              <span className="detail-value">
                {Math.round(daily.temperature_2m_max[0])}° / {Math.round(daily.temperature_2m_min[0])}°
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🌬️</span>
              <span className="detail-value" style={{ color: currentAQIInfo.color }}>
                AQI {currentAQI || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast - Right Side */}
        <div className="forecast-section">
          <div className="forecast-grid">
            {daily.time.slice(1, 8).map((date, index) => {
              const actualIndex = index + 1;
              const dayAQI = getDailyAQI(actualIndex);
              const aqiInfo = getAQIInfo(dayAQI);
              return (
                <div key={actualIndex} className="forecast-day-card">
                  <div className="forecast-day">{formatDayOfWeek(date)}</div>
                  <div className="forecast-icon">{getWeatherIcon(daily.weather_code[actualIndex])}</div>
                  <div className="forecast-temps">
                    <span className="temp-high">{Math.round(daily.temperature_2m_max[actualIndex])}°</span>
                    <span className="temp-low">{Math.round(daily.temperature_2m_min[actualIndex])}°</span>
                  </div>
                  <div className="forecast-details">
                    <div className="forecast-precipitation">💧 {daily.precipitation_probability_max[actualIndex]}%</div>
                    <div className="forecast-aqi" style={{ color: aqiInfo.color }}>
                      🌬️ AQI {dayAQI || 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherDashboard;
