const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const connectDB = require('./config/database');
const preferencesRoutes = require('./routes/preferences');
const photosRoutes = require('./routes/photos');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Increase limit for base64 images (10MB file = ~13MB base64)
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// API Routes
app.use('/api/preferences', preferencesRoutes);
app.use('/api/photos', photosRoutes);

// Proxy routes for external APIs
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
