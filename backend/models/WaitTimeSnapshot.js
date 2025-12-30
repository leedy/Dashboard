const mongoose = require('mongoose');

const waitTimeSnapshotSchema = new mongoose.Schema({
  rideId: {
    type: Number,
    required: true,
    index: true
  },
  rideName: {
    type: String,
    required: true
  },
  parkId: {
    type: Number,
    required: true,
    index: true
  },
  landId: {
    type: Number
  },
  landName: {
    type: String
  },
  waitTime: {
    type: Number,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  parkAvgWait: {
    type: Number  // Average wait time across the park at this snapshot
  },
  parkOpenRideCount: {
    type: Number  // Number of rides currently open in this park
  },
  context: {
    dayOfWeek: {
      type: Number,  // 0-6 (Sunday-Saturday)
      required: true
    },
    hour: {
      type: Number,  // 0-23
      required: true
    },
    month: {
      type: Number,  // 1-12
      required: true
    },
    year: {
      type: Number,  // e.g., 2025
      required: true
    },
    weekOfYear: {
      type: Number,  // 1-53
      required: true
    },
    isWeekend: {
      type: Boolean,
      required: true
    },
    isHoliday: {
      type: Boolean,
      default: false
    },
    holidayName: {
      type: String
    },
    weather: {
      temperature: Number,
      feelsLike: Number,
      humidity: Number,
      weatherCode: Number,
      isRaining: Boolean
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient ride history lookups
waitTimeSnapshotSchema.index({ rideId: 1, timestamp: -1 });

// Compound index for park-wide history
waitTimeSnapshotSchema.index({ parkId: 1, timestamp: -1 });

// Compound index for prediction queries (day/hour patterns)
waitTimeSnapshotSchema.index({ 'context.dayOfWeek': 1, 'context.hour': 1, rideId: 1 });

// Unique index to prevent duplicate snapshots (safety net for multi-instance deployments)
waitTimeSnapshotSchema.index({ rideId: 1, timestamp: 1 }, { unique: true });

// Note: No TTL index - data is kept forever for long-term predictions

module.exports = mongoose.model('WaitTimeSnapshot', waitTimeSnapshotSchema);
