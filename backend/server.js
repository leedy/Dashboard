const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Parser = require('rss-parser');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const preferencesRoutes = require('./routes/preferences');
const photosRoutes = require('./routes/photos');
const adminPhotosRoutes = require('./routes/adminPhotos');
const gameCacheRoutes = require('./routes/gameCache');
const standingsCacheRoutes = require('./routes/standingsCache');
const stocksRoutes = require('./routes/stocks');
const usageRoutes = require('./routes/usage');
const adminAuthRoutes = require('./routes/adminAuth');
const userAuthRoutes = require('./routes/userAuth');
const tmdbRoutes = require('./routes/tmdb');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Trust proxy headers (for nginx reverse proxy)
app.set('trust proxy', true);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Increase limit for base64 images (10MB file = ~13MB base64)
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// API Routes
app.use('/api/auth', userAuthRoutes); // User authentication (register, login, profile)
app.use('/api/admin/auth', adminAuthRoutes); // Admin authentication
app.use('/api/admin/photos', adminPhotosRoutes); // Admin photo management (all photos, all users)
app.use('/api/preferences', preferencesRoutes);
app.use('/api/photos', photosRoutes); // User photo routes (per-user photos only)
app.use('/api/games', gameCacheRoutes);
app.use('/api/standings', standingsCacheRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Proxy routes for external APIs
// Custom NHL endpoint for recent games
app.get('/api/nhl/team/:teamAbbrev/recent-games', async (req, res) => {
  try {
    const { teamAbbrev } = req.params;
    const currentDate = new Date();
    const currentYear = currentDate.getMonth() >= 9 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
    const seasonId = `${currentYear}${currentYear + 1}`;

    console.log(`Fetching recent games for ${teamAbbrev} in season ${seasonId}`);

    // Fetch team's full season schedule
    const scheduleUrl = `https://api-web.nhle.com/v1/club-schedule-season/${teamAbbrev}/${seasonId}`;
    const response = await axios.get(scheduleUrl);

    // Filter for completed games and get last 10
    const completedGames = response.data.games
      .filter(game => game.gameState === 'OFF' || game.gameState === 'FINAL')
      .sort((a, b) => new Date(b.startTimeUTC) - new Date(a.startTimeUTC))
      .slice(0, 10);

    // Format game data
    const formattedGames = completedGames.map(game => {
      const isHome = game.homeTeam.abbrev === teamAbbrev;
      const teamScore = isHome ? game.homeTeam.score : game.awayTeam.score;
      const opponentScore = isHome ? game.awayTeam.score : game.homeTeam.score;
      const opponent = isHome ? game.awayTeam.placeName.default : game.homeTeam.placeName.default;

      let result = 'loss';
      let resultText = 'L';

      if (teamScore > opponentScore) {
        result = 'win';
        resultText = 'W';
      } else if (game.periodDescriptor?.periodType === 'OT' || game.periodDescriptor?.periodType === 'SO') {
        result = 'otl';
        resultText = 'OTL';
      }

      const gameDate = new Date(game.startTimeUTC);
      const formattedDate = gameDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return {
        date: formattedDate,
        opponent,
        homeAway: isHome ? 'home' : 'away',
        teamScore,
        opponentScore,
        result,
        resultText
      };
    });

    res.json({ games: formattedGames });
  } catch (error) {
    console.error('Error fetching recent games:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent games' });
  }
});

// NHL API proxy
app.use('/api/nhl', async (req, res) => {
  try {
    // Remove /api/nhl from the path
    const path = req.url.replace('/api/nhl', '');
    const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query)}` : '';
    const targetUrl = `https://api-web.nhle.com${path}${queryString}`;
    console.log('NHL Proxy:', targetUrl);
    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    console.error('NHL API proxy error:', error.message);
    res.status(error.response?.status || 500).json({ error: 'NHL API request failed' });
  }
});

// NFL API proxy
app.use('/api/nfl', async (req, res) => {
  try {
    // Remove /api/nfl from the path
    const path = req.url.replace('/api/nfl', '');
    const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query)}` : '';
    const targetUrl = `https://site.api.espn.com${path}${queryString}`;
    console.log('NFL Proxy:', targetUrl);
    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    console.error('NFL API proxy error:', error.message);
    res.status(error.response?.status || 500).json({ error: 'NFL API request failed' });
  }
});

// MLB API proxy
app.use('/api/mlb', async (req, res) => {
  try {
    // Remove /api/mlb from the path
    const path = req.url.replace('/api/mlb', '');
    const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query)}` : '';
    const targetUrl = `https://site.api.espn.com${path}${queryString}`;
    console.log('MLB Proxy:', targetUrl);
    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    console.error('MLB API proxy error:', error.message);
    res.status(error.response?.status || 500).json({ error: 'MLB API request failed' });
  }
});

// Queue-Times API proxy
app.use('/api/queue-times', async (req, res) => {
  try {
    // Remove /api/queue-times from the path
    const path = req.url.replace('/api/queue-times', '');
    const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query)}` : '';
    const targetUrl = `https://queue-times.com${path}${queryString}`;
    console.log('Queue-Times Proxy:', targetUrl);
    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Queue-Times API proxy error:', error.message);
    res.status(error.response?.status || 500).json({ error: 'Queue-Times API request failed' });
  }
});

// ThemeParks.wiki API proxy
app.use('/api/themeparks', async (req, res) => {
  try {
    // Remove /api/themeparks from the path
    const path = req.url.replace('/api/themeparks', '');
    const queryString = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query)}` : '';
    const targetUrl = `https://api.themeparks.wiki${path}${queryString}`;
    console.log('ThemeParks Proxy:', targetUrl);
    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    console.error('ThemeParks API proxy error:', error.message);
    res.status(error.response?.status || 500).json({ error: 'ThemeParks API request failed' });
  }
});

// Team news RSS feed endpoint - supports any team
app.get('/api/news/team/:teamName', async (req, res) => {
  try {
    const parser = new Parser();
    const { teamName } = req.params;

    // Encode team name for URL
    const encodedTeamName = encodeURIComponent(teamName);
    const feedUrl = `https://news.google.com/rss/search?q=${encodedTeamName}&hl=en-US&gl=US&ceid=US:en`;

    console.log(`Fetching ${teamName} news from Google News RSS`);
    const feed = await parser.parseURL(feedUrl);

    // Transform feed items to a cleaner format
    const articles = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source?.name || 'Unknown',
      description: item.contentSnippet || item.content || ''
    }));

    res.json({
      articles,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('News RSS feed error:', error.message);
    res.status(500).json({ error: 'Failed to fetch news feed' });
  }
});

// Legacy endpoint for Flyers news (backwards compatibility)
app.get('/api/news/flyers', async (req, res) => {
  try {
    const parser = new Parser();
    const feedUrl = 'https://news.google.com/rss/search?q=Philadelphia+Flyers&hl=en-US&gl=US&ceid=US:en';

    console.log('Fetching Flyers news from Google News RSS');
    const feed = await parser.parseURL(feedUrl);

    const articles = feed.items.slice(0, 15).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source?.name || 'Unknown',
      description: item.contentSnippet || item.content || ''
    }));

    res.json({
      articles,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('News RSS feed error:', error.message);
    res.status(500).json({ error: 'Failed to fetch news feed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve static files from the React app in production
// Check if dist folder exists (production build)
const distPath = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));

  // Handle React routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('Serving production build from /dist');
} else {
  console.log('No production build found. Run "npm run build" first or use "npm run dev:all" for development.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible at http://localhost:${PORT} and http://<your-ip>:${PORT}`);
});
