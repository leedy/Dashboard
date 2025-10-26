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

    // Helper function to check if any games are live
    const hasLiveGames = (data, sportType) => {
      if (sportType === 'nhl') {
        const games = data.games || [];
        return games.some(game => game.gameState === 'LIVE' || game.gameState === 'CRIT');
      } else if (sportType === 'nfl' || sportType === 'mlb') {
        const events = data.events || [];
        return events.some(event => event.competitions[0].status.type.state === 'in');
      }
      return false;
    };

    // Helper function to check if all games are final
    const allGamesFinal = (data, sportType) => {
      if (sportType === 'nhl') {
        const games = data.games || [];
        if (games.length === 0) return true;
        return games.every(game => game.gameState === 'FINAL' || game.gameState === 'OFF');
      } else if (sportType === 'nfl' || sportType === 'mlb') {
        const events = data.events || [];
        if (events.length === 0) return true;
        return events.every(event => event.competitions[0].status.type.completed);
      }
      return false;
    };

    const now = new Date();

    if (cacheEntry) {
      const cacheAge = (now - new Date(cacheEntry.lastUpdated)) / 1000 / 60; // age in minutes

      // Determine cache TTL based on game states
      let CACHE_TTL_MINUTES;
      const hasLive = hasLiveGames(cacheEntry.data, sport);
      const allFinal = allGamesFinal(cacheEntry.data, sport);

      if (allFinal) {
        CACHE_TTL_MINUTES = 60; // All games final: cache for 1 hour (no need to keep checking)
      } else if (hasLive) {
        CACHE_TTL_MINUTES = 1; // Live games: refresh every 1 minute for real-time updates
      } else {
        CACHE_TTL_MINUTES = 30; // Games scheduled but not started: refresh every 30 minutes
      }

      if (cacheAge < CACHE_TTL_MINUTES) {
        console.log(`Returning cached ${sport} games from ${cacheEntry.lastUpdated} (${Math.round(cacheAge)} min old) - ${allFinal ? 'all final' : hasLive ? 'has live games' : 'pre-game'}`);
        return res.json({
          data: cacheEntry.data,
          cached: true,
          lastUpdated: cacheEntry.lastUpdated
        });
      } else {
        console.log(`Cache expired for ${sport} (${Math.round(cacheAge)} min old), fetching fresh data`);
      }
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

    // Save to cache (update if exists, create if new)
    if (cacheEntry) {
      // Update existing cache entry
      cacheEntry.data = apiData;
      cacheEntry.lastUpdated = new Date();
      await cacheEntry.save();
      console.log(`Updated cached ${sport} games for ${today}`);
    } else {
      // Create new cache entry
      cacheEntry = new GameCache({
        sport,
        date: today,
        data: apiData,
        lastUpdated: new Date()
      });
      await cacheEntry.save();
      console.log(`Cached ${sport} games for ${today}`);
    }

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
