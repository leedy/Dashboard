/**
 * Weather Service for Disney Wait Time Tracking
 * Fetches current weather conditions at Disney World (Orlando, FL)
 * Uses Open-Meteo API (no API key required)
 */

// Disney World coordinates (Magic Kingdom area)
const DISNEY_WORLD_LAT = 28.3852;
const DISNEY_WORLD_LON = -81.5639;

// Cache weather data to avoid excessive API calls
let weatherCache = {
  data: null,
  timestamp: null,
  ttl: 10 * 60 * 1000  // 10 minutes
};

/**
 * Weather codes from Open-Meteo API
 * https://open-meteo.com/en/docs
 */
const RAIN_CODES = [
  51, 53, 55,    // Drizzle
  61, 63, 65,    // Rain
  66, 67,        // Freezing rain
  80, 81, 82,    // Rain showers
  95, 96, 99     // Thunderstorm
];

/**
 * Get current weather at Disney World
 * @returns {Promise<{temperature: number, feelsLike: number, humidity: number, weatherCode: number, isRaining: boolean} | null>}
 */
async function getCurrentWeather() {
  // Check cache first
  if (weatherCache.data && weatherCache.timestamp) {
    const age = Date.now() - weatherCache.timestamp;
    if (age < weatherCache.ttl) {
      return weatherCache.data;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DISNEY_WORLD_LAT}&longitude=${DISNEY_WORLD_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Weather API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    const weather = {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      weatherCode: data.current.weather_code,
      isRaining: RAIN_CODES.includes(data.current.weather_code)
    };

    // Update cache
    weatherCache.data = weather;
    weatherCache.timestamp = Date.now();

    return weather;
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return null;
  }
}

/**
 * Check if it's currently raining at Disney World
 * @returns {Promise<boolean>}
 */
async function isRaining() {
  const weather = await getCurrentWeather();
  return weather ? weather.isRaining : false;
}

module.exports = {
  getCurrentWeather,
  isRaining,
  DISNEY_WORLD_LAT,
  DISNEY_WORLD_LON
};
