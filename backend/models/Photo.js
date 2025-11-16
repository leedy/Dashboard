const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
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

// Indexes for efficient queries
photoSchema.index({ userId: 1, category: 1, uploadDate: -1 });
photoSchema.index({ category: 1, uploadDate: -1 });

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
