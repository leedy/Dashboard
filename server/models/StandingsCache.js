const mongoose = require('mongoose');

const standingsCacheSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.Mixed, // Store standings data (records map)
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
standingsCacheSchema.index({ sport: 1, date: 1 }, { unique: true });

// Auto-delete cache entries older than 7 days
standingsCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days in seconds

module.exports = mongoose.model('StandingsCache', standingsCacheSchema);
