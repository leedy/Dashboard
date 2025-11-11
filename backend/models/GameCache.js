const mongoose = require('mongoose');

const gameCacheSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    enum: ['nhl', 'nfl', 'mlb']
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Store entire API response
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for efficient lookups
gameCacheSchema.index({ sport: 1, date: 1 }, { unique: true });

// Auto-delete cache entries older than 7 days
gameCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days in seconds

module.exports = mongoose.model('GameCache', gameCacheSchema);
