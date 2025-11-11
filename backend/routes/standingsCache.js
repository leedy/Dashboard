const express = require('express');
const router = express.Router();
const axios = require('axios');
const StandingsCache = require('../models/StandingsCache');
const GameCache = require('../models/GameCache');

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fetch NHL standings from API
const fetchNHLStandings = async (today) => {
  const response = await axios.get(`https://api-web.nhle.com/v1/standings/${today}`);
  const standingsData = response.data.standings || [];

  // Create a map of team abbreviation to record
  const recordsMap = {};
  standingsData.forEach(team => {
    const abbrev = team.teamAbbrev?.default;
    if (abbrev) {
      recordsMap[abbrev] = {
        wins: team.wins || 0,
        losses: team.losses || 0,
        otLosses: team.otLosses || 0
      };
    }
  });
  return recordsMap;
};

// Fetch NFL standings from API
const fetchNFLStandings = async () => {
  const divisions = [
    { id: 1 }, { id: 10 }, { id: 11 }, { id: 3 },
    { id: 4 }, { id: 12 }, { id: 13 }, { id: 6 }
  ];

  const requests = divisions.map(div =>
    axios.get(`https://site.api.espn.com/apis/v2/sports/football/nfl/standings?group=${div.id}`)
  );

  const responses = await Promise.all(requests);
  const recordsMap = {};

  responses.forEach(response => {
    response.data.standings?.entries?.forEach(teamEntry => {
      const teamName = teamEntry.team.displayName;
      const stats = teamEntry.stats || [];
      const wins = stats.find(s => s.name === 'wins')?.value || 0;
      const losses = stats.find(s => s.name === 'losses')?.value || 0;
      const ties = stats.find(s => s.name === 'ties')?.value || 0;

      recordsMap[teamName] = { wins, losses, ties };
    });
  });

  return recordsMap;
};

// Fetch MLB standings from API
const fetchMLBStandings = async () => {
  // MLB uses divisions 5, 6, 7 for AL and 15, 16, 17 for NL
  const divisions = [5, 6, 7, 15, 16, 17];

  const requests = divisions.map(divId =>
    axios.get(`https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings?group=${divId}`)
  );

  const responses = await Promise.all(requests);
  const recordsMap = {};

  responses.forEach(response => {
    response.data.standings?.entries?.forEach(teamEntry => {
      const teamName = teamEntry.team.displayName;
      const stats = teamEntry.stats || [];
      const wins = stats.find(s => s.name === 'wins')?.value || 0;
      const losses = stats.find(s => s.name === 'losses')?.value || 0;

      recordsMap[teamName] = { wins, losses };
    });
  });

  return recordsMap;
};

// Helper function to check game states from game cache
const getGameStatesFromCache = async (sport, today) => {
  const gameCache = await GameCache.findOne({ sport, date: today });

  if (!gameCache) {
    return { hasLive: false, allFinal: false };
  }

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

  return {
    hasLive: hasLiveGames(gameCache.data, sport),
    allFinal: allGamesFinal(gameCache.data, sport)
  };
};

// Get cached standings or fetch from external API
router.get('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const today = getTodayDate();

    console.log(`Standings cache request for ${sport} on ${today}`);

    // Check if we have cached standings for today
    let cacheEntry = await StandingsCache.findOne({ sport, date: today });

    const now = new Date();

    if (cacheEntry) {
      const cacheAge = (now - new Date(cacheEntry.lastUpdated)) / 1000 / 60; // age in minutes

      // Determine cache TTL based on game states
      const gameStates = await getGameStatesFromCache(sport, today);
      let CACHE_TTL_MINUTES;

      if (gameStates.allFinal) {
        // All games finished: standings may have been updated, cache for 15 min
        CACHE_TTL_MINUTES = 15;
      } else if (gameStates.hasLive) {
        // Live games: standings won't change until games finish, cache for 30 min
        CACHE_TTL_MINUTES = 30;
      } else {
        // Pre-game or no games: standings won't change, cache for 2 hours
        CACHE_TTL_MINUTES = 120;
      }

      if (cacheAge < CACHE_TTL_MINUTES) {
        console.log(`Returning cached ${sport} standings from ${cacheEntry.lastUpdated} (${Math.round(cacheAge)} min old) - TTL: ${CACHE_TTL_MINUTES} min`);
        return res.json({
          data: cacheEntry.data,
          cached: true,
          lastUpdated: cacheEntry.lastUpdated
        });
      } else {
        console.log(`Standings cache expired for ${sport} (${Math.round(cacheAge)} min old), fetching fresh data`);
      }
    }

    // No cache found or cache expired, fetch from external API
    console.log(`Fetching fresh ${sport} standings from external API`);

    let standingsData;
    if (sport === 'nhl') {
      standingsData = await fetchNHLStandings(today);
    } else if (sport === 'nfl') {
      standingsData = await fetchNFLStandings();
    } else if (sport === 'mlb') {
      standingsData = await fetchMLBStandings();
    } else {
      return res.status(400).json({ error: 'Invalid sport' });
    }

    // Save to cache (update if exists, create if new)
    if (cacheEntry) {
      // Update existing cache entry
      cacheEntry.data = standingsData;
      cacheEntry.lastUpdated = new Date();
      await cacheEntry.save();
      console.log(`Updated cached ${sport} standings for ${today}`);
    } else {
      // Create new cache entry
      cacheEntry = new StandingsCache({
        sport,
        date: today,
        data: standingsData,
        lastUpdated: new Date()
      });
      await cacheEntry.save();
      console.log(`Cached ${sport} standings for ${today}`);
    }

    res.json({
      data: standingsData,
      cached: false,
      lastUpdated: cacheEntry.lastUpdated
    });
  } catch (error) {
    console.error('Error in standings cache:', error);
    res.status(500).json({ error: 'Failed to fetch standings data' });
  }
});

// Force refresh - delete cache and fetch fresh data
router.post('/:sport/refresh', async (req, res) => {
  try {
    const { sport } = req.params;
    const today = getTodayDate();

    console.log(`Force refreshing ${sport} standings for ${today}`);

    // Delete existing cache
    await StandingsCache.deleteOne({ sport, date: today });

    // Fetch fresh data
    let standingsData;
    if (sport === 'nhl') {
      standingsData = await fetchNHLStandings(today);
    } else if (sport === 'nfl') {
      standingsData = await fetchNFLStandings();
    } else if (sport === 'mlb') {
      standingsData = await fetchMLBStandings();
    } else {
      return res.status(400).json({ error: 'Invalid sport' });
    }

    // Save to cache
    const cacheEntry = new StandingsCache({
      sport,
      date: today,
      data: standingsData,
      lastUpdated: new Date()
    });
    await cacheEntry.save();

    console.log(`Refreshed and cached ${sport} standings for ${today}`);

    res.json({
      data: standingsData,
      cached: false,
      lastUpdated: cacheEntry.lastUpdated,
      refreshed: true
    });
  } catch (error) {
    console.error('Error refreshing standings cache:', error);
    res.status(500).json({ error: 'Failed to refresh standings data' });
  }
});

module.exports = router;
