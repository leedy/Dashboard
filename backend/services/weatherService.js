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

/**
 * Get 5-day forecast for Disney World
 * @returns {Promise<Array<{date: string, high: number, low: number, weatherCode: number, precipChance: number}> | null>}
 */
async function getForecast() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DISNEY_WORLD_LAT}&longitude=${DISNEY_WORLD_LON}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FNew_York&forecast_days=6`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Forecast API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Map the daily data into a more usable format
    const forecast = data.daily.time.map((date, index) => ({
      date: date,
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
      weatherCode: data.daily.weather_code[index],
      precipChance: data.daily.precipitation_probability_max[index] || 0
    }));

    return forecast;
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    return null;
  }
}

/**
 * Get weather description from code
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: 'Clear',
    1: 'Mostly Clear',
    2: 'Partly Cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    66: 'Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm w/ Hail',
    99: 'Severe Thunderstorm'
  };
  return descriptions[code] || 'Unknown';
}

module.exports = {
  getCurrentWeather,
  isRaining,
  getForecast,
  getWeatherDescription,
  DISNEY_WORLD_LAT,
  DISNEY_WORLD_LON
};
