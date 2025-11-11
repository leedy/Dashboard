const mongoose = require('mongoose');

const usageEventSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      'dashboard_view',
      'dashboard_switch',
      'settings_open',
      'settings_change',
      'admin_open',
      'modal_open',
      'feature_use',
      'page_load',
      'error_occurred'
    ]
  },

  // What was accessed/used
  dashboardId: String,
  featureName: String,

  // User identification (session-based now, user-based later)
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: 'default-user',
    index: true
  },

  // Network info
  ipAddress: String,
  userAgent: String,

  // Timing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: Number, // milliseconds spent (for dashboard views)

  // Additional context
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Browser/device info
  browserInfo: {
    name: String,
    version: String,
    os: String,
    device: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for efficient querying
usageEventSchema.index({ eventType: 1, timestamp: -1 });
usageEventSchema.index({ dashboardId: 1, timestamp: -1 });
usageEventSchema.index({ userId: 1, timestamp: -1 });

// TTL index - automatically delete events older than 90 days (optional)
// Uncomment if you want auto-cleanup:
// usageEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('UsageEvent', usageEventSchema);
