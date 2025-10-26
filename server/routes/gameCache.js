const express = require('express');
const router = express.Router();
const axios = require('axios');
const GameCache = require('../models/GameCache');

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get cached games or fetch from external API
router.get('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const today = getTodayDate();

    console.log(`Game cache request for ${sport} on ${today}`);

    // Check if we have cached data for today
    let cacheEntry = await GameCache.findOne({ sport, date: today });

    if (cacheEntry) {
      console.log(`Returning cached ${sport} games from ${cacheEntry.lastUpdated}`);
      return res.json({
        data: cacheEntry.data,
        cached: true,
        lastUpdated: cacheEntry.lastUpdated
      });
    }

    // No cache found, fetch from external API
    console.log(`No cache found for ${sport}, fetching from external API`);

    let apiData;
    if (sport === 'nhl') {
      const response = await axios.get(`https://api-web.nhle.com/v1/score/${today}`);
      apiData = response.data;
    } else if (sport === 'nfl') {
      const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`);
      apiData = response.data;
    } else if (sport === 'mlb') {
      const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard`);
      apiData = response.data;
    } else {
      return res.status(400).json({ error: 'Invalid sport' });
    }

    // Save to cache
    cacheEntry = new GameCache({
      sport,
      date: today,
      data: apiData,
      lastUpdated: new Date()
    });
    await cacheEntry.save();

    console.log(`Cached ${sport} games for ${today}`);

    res.json({
      data: apiData,
      cached: false,
      lastUpdated: cacheEntry.lastUpdated
    });
  } catch (error) {
    console.error('Error in game cache:', error);
    res.status(500).json({ error: 'Failed to fetch game data' });
  }
});

// Force refresh - delete cache and fetch fresh data
router.post('/:sport/refresh', async (req, res) => {
  try {
    const { sport } = req.params;
    const today = getTodayDate();

    console.log(`Force refreshing ${sport} games for ${today}`);

    // Delete existing cache
    await GameCache.deleteOne({ sport, date: today });

    // Fetch fresh data
    let apiData;
    if (sport === 'nhl') {
      const response = await axios.get(`https://api-web.nhle.com/v1/score/${today}`);
      apiData = response.data;
    } else if (sport === 'nfl') {
      const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`);
      apiData = response.data;
    } else if (sport === 'mlb') {
      const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard`);
      apiData = response.data;
    } else {
      return res.status(400).json({ error: 'Invalid sport' });
    }

    // Save to cache
    const cacheEntry = new GameCache({
      sport,
      date: today,
      data: apiData,
      lastUpdated: new Date()
    });
    await cacheEntry.save();

    console.log(`Refreshed and cached ${sport} games for ${today}`);

    res.json({
      data: apiData,
      cached: false,
      lastUpdated: cacheEntry.lastUpdated,
      refreshed: true
    });
  } catch (error) {
    console.error('Error refreshing game cache:', error);
    res.status(500).json({ error: 'Failed to refresh game data' });
  }
});

module.exports = router;
