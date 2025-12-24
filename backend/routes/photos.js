const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const multer = require('multer');
const userAuth = require('../middleware/userAuth');

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

// Upload photos (supports multiple files) - requires authentication
router.post('/upload', userAuth, upload.array('photos', 20), async (req, res) => {
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

        // Determine userId: 'system' for dashboard-assets, authenticated user for personal photos
        const photoUserId = category === 'dashboard-assets' ? 'system' : req.user.userId;

        // Create photo document
        const photo = new Photo({
          userId: photoUserId,
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

// Get all photos or filter by category for authenticated user
router.get('/', userAuth, async (req, res) => {
  try {
    const { category, metadata } = req.query;

    let query = {};

    // For dashboard-assets, return all system assets (no user filtering)
    // For personal categories, filter by authenticated user
    if (category === 'dashboard-assets') {
      query = { category: 'dashboard-assets', userId: 'system' };
    } else if (category) {
      // Specific personal category
      query = { userId: req.user.userId, category };
    } else {
      // No category specified - return user's personal photos only (not system assets)
      query = { userId: req.user.userId };
    }

    // If metadata=true, exclude heavy base64Data for faster listing
    const selectFields = metadata === 'true'
      ? '-base64Data'
      : undefined;

    const photos = await Photo.find(query)
      .select(selectFields)
      .sort({ uploadDate: -1 });

    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Get single photo with full base64 data
router.get('/:id', userAuth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Allow access to system assets (dashboard-assets) or own photos
    if (photo.userId !== 'system' && photo.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to access this photo' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Get photo as image (for use in img src)
// Supports token via query param since img tags can't send Authorization header
router.get('/:id/image', async (req, res) => {
  try {
    // Get token from query param or header
    const token = req.query.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).send('Authentication required');
    }

    // Verify token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).send('Invalid token');
    }

    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).send('Photo not found');
    }

    // Allow access to system assets (dashboard-assets) or own photos
    if (photo.userId !== 'system' && photo.userId !== decoded.userId) {
      return res.status(403).send('Not authorized');
    }

    // Extract the actual base64 data (remove data:image/...;base64, prefix)
    const matches = photo.base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(500).send('Invalid image data');
    }

    const contentType = matches[1];
    const imageData = Buffer.from(matches[2], 'base64');

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(imageData);
  } catch (error) {
    console.error('Error fetching photo image:', error);
    res.status(500).send('Failed to fetch photo');
  }
});

// Delete photo for authenticated user
router.delete('/:id', userAuth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // For personal photos: only owner can delete
    // For dashboard-assets: any authenticated user can delete (system-wide)
    if (photo.userId !== 'system' && photo.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this photo' });
    }

    await Photo.findByIdAndDelete(req.params.id);

    res.json({ message: 'Photo deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
