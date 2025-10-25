const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const multer = require('multer');

// Configure multer for memory storage (we'll convert to base64)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Upload photos (supports multiple files)
router.post('/upload', upload.array('photos', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { category } = req.body;

    if (!category || !['family-photos', 'event-slides', 'dashboard-assets'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each file
    for (const file of req.files) {
      try {
        // Convert buffer to base64 data URI
        const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        // Create photo document
        const photo = new Photo({
          category,
          filename: file.originalname,
          base64Data,
          contentType: file.mimetype,
          fileSize: file.size
        });

        await photo.save();

        // Add to success array without base64 data
        const photoResponse = photo.toObject();
        delete photoResponse.base64Data;
        results.success.push(photoResponse);
      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        results.failed.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    // Return results
    const statusCode = results.failed.length === 0 ? 201 : (results.success.length === 0 ? 500 : 207);
    res.status(statusCode).json(results);
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos', details: error.message });
  }
});

// Get all photos or filter by category
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    const query = category ? { category } : {};

    // Get photos with base64 data (needed for thumbnails)
    const photos = await Photo.find(query)
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
