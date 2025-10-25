const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['family-photos', 'event-slides', 'dashboard-assets'],
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  base64Data: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient category queries
photoSchema.index({ category: 1, uploadDate: -1 });

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
