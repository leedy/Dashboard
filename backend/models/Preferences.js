const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // Each user has one preferences document
    index: true
  },
  favoriteNHLTeam: {
    abbrev: { type: String, default: 'PHI' },
    name: { type: String, default: 'Philadelphia Flyers' }
  },
  favoriteNFLTeam: {
    abbrev: { type: String, default: 'PHI' },
    name: { type: String, default: 'Philadelphia Eagles' }
  },
  favoriteMLBTeam: {
    abbrev: { type: String, default: 'PHI' },
    name: { type: String, default: 'Philadelphia Phillies' }
  },
  weatherLocation: {
    zipcode: { type: String, default: '17042' },
    city: { type: String, default: 'Lebanon, PA' },
    latitude: { type: Number, default: 40.34093 },
    longitude: { type: Number, default: -76.41135 }
  },
  countdownEvent: {
    name: { type: String, default: 'New Year' },
    date: { type: String, default: '2026-01-01' }
  },
  countdownEvents: {
    type: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      date: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  defaultDashboard: {
    type: String,
    default: 'todays-games'
  },
  displaySettings: {
    autoRotate: { type: Boolean, default: false },
    rotateInterval: { type: Number, default: 30 },
    refreshInterval: { type: Number, default: 60000 },
    rotationDashboards: {
      type: [String],
      default: [
        'todays-games',
        'upcoming-games',
        'standings',
        'weather',
        'countdown',
        'disney',
        'movies',
        'family-photos',
        'event-slides'
      ]
    },
    familyPhotoInterval: { type: Number, default: 10000 },
    eventPhotoInterval: { type: Number, default: 10000 }
  },
  disneyExcludedRides: {
    type: [Number],
    default: []
  },
  disneyKnownRides: {
    type: [Number],
    default: []
  },
  tmdbApiKey: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Preferences', preferencesSchema);
