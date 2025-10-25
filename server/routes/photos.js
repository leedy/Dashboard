const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const multer = require('multer');

// Configure multer for memory storage (we'll convert to base64)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Upload photo
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category } = req.body;

    if (!category || !['family-photos', 'event-slides', 'dashboard-assets'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Convert buffer to base64 data URI
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Create photo document
    const photo = new Photo({
      category,
      filename: req.file.originalname,
      base64Data,
      contentType: req.file.mimetype,
      fileSize: req.file.size
    });

    await photo.save();

    // Return photo without the full base64 data (to reduce response size)
    const photoResponse = photo.toObject();
    delete photoResponse.base64Data;

    res.status(201).json(photoResponse);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo', details: error.message });
  }
});

// Get all photos or filter by category
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    const query = category ? { category } : {};

    // Get photos without base64 data for listing (metadata only)
    const photos = await Photo.find(query)
      .select('-base64Data')
      .sort({ uploadDate: -1 });

    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get single photo with full base64 data
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Delete photo
router.delete('/:id', async (req, res) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({ message: 'Photo deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
