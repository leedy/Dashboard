const express = require('express');
const router = express.Router();
const axios = require('axios');
const Preferences = require('../models/Preferences');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to get system API key
async function getSystemApiKey() {
  try {
    const systemPrefs = await Preferences.findOne({ userId: 'default-user' });
    return systemPrefs?.tmdbApiKey || null;
  } catch (error) {
    console.error('Error fetching system TMDb API key:', error);
    return null;
  }
}

// GET /api/tmdb/upcoming - Get upcoming movies
router.get('/upcoming', async (req, res) => {
  try {
    const apiKey = await getSystemApiKey();

    if (!apiKey) {
      return res.status(503).json({
        error: 'TMDb API key not configured. Please configure it in the Admin panel.'
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
      params: {
        api_key: apiKey,
        language: 'en-US',
        page: 1,
        region: 'US'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching upcoming movies from TMDb:', error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid TMDb API key. Please check the API key in the Admin panel.'
      });
    }

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.status_message || 'Failed to fetch upcoming movies'
    });
  }
});

module.exports = router;
