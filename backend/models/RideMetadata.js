const mongoose = require('mongoose');

const rideMetadataSchema = new mongoose.Schema({
  rideId: {
    type: Number,
    required: true,
    unique: true,
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
  classification: {
    type: {
      type: String,
      enum: ['headliner', 'popular', 'standard', 'minor', 'unclassified'],
      default: 'unclassified'
    },
    avgWaitTime: {
      type: Number,
      default: 0
    },
    peakAvgWaitTime: {
      type: Number,
      default: 0
    },
    lastCalculated: {
      type: Date
    }
  },
  stats: {
    totalSnapshots: {
      type: Number,
      default: 0
    },
    avgWaitOverall: {
      type: Number,
      default: 0
    },
    avgWaitByHour: {
      type: [Number],  // 24 elements (0-23)
      default: () => new Array(24).fill(0)
    },
    avgWaitByDay: {
      type: [Number],  // 7 elements (0-6, Sunday-Saturday)
      default: () => new Array(7).fill(0)
    },
    peakHour: {
      type: Number
    },
    lowHour: {
      type: Number
    }
  },
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  peakWaitTime: {
    type: Number,
    default: null
  },
  peakWaitTimeDate: {
    type: Date,
    default: null
  },
  peakWaitTimeContext: {
    dayOfWeek: Number,
    hour: Number,
    month: Number,
    year: Number,
    isWeekend: Boolean,
    isHoliday: Boolean,
    holidayName: String
  }
}, {
  timestamps: true
});

// Index for finding rides by park
rideMetadataSchema.index({ parkId: 1, isActive: 1 });

// Index for classification queries
rideMetadataSchema.index({ 'classification.type': 1 });

module.exports = mongoose.model('RideMetadata', rideMetadataSchema);
