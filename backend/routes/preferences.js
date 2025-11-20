const express = require('express');
const router = express.Router();
const Preferences = require('../models/Preferences');
const userAuth = require('../middleware/userAuth');
const adminAuth = require('../middleware/adminAuth');

// Get preferences for the authenticated user (or specific user if admin with userId query param)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // If userId query param is provided, require admin authentication
    if (userId) {
      // Check if request has admin token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Admin authentication required to query other users' });
      }

      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }

        // Admin can query any user's preferences
        let preferences = await Preferences.findOne({ userId });

        if (!preferences) {
          preferences = new Preferences({ userId });
          await preferences.save();
        }

        return res.json(preferences);
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid admin token' });
      }
    }

    // Regular user authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.isAdmin) {
        return res.status(403).json({ error: 'User token required (not admin token)' });
      }

      let preferences = await Preferences.findOne({ userId: decoded.userId });

      // If no preferences exist, create default ones
      if (!preferences) {
        preferences = new Preferences({ userId: decoded.userId });
        await preferences.save();
      }

      res.json(preferences);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preferences for the authenticated user (or specific user if admin with userId query param)
router.put('/', async (req, res) => {
  try {
    const { userId } = req.query;

    // If userId query param is provided, require admin authentication
    if (userId) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Admin authentication required' });
      }

      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }

        // Admin can update any user's preferences
        let preferences = await Preferences.findOne({ userId });

        if (!preferences) {
          preferences = new Preferences({
            userId,
            ...req.body
          });
        } else {
          Object.assign(preferences, req.body);
        }

        await preferences.save();
        return res.json(preferences);
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid admin token' });
      }
    }

    // Regular user authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.isAdmin) {
        return res.status(403).json({ error: 'User token required (not admin token)' });
      }

      let preferences = await Preferences.findOne({ userId: decoded.userId });

      if (!preferences) {
        preferences = new Preferences({
          userId: decoded.userId,
          ...req.body
        });
      } else {
        Object.assign(preferences, req.body);
      }

      await preferences.save();
      res.json(preferences);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Reset preferences to defaults for authenticated user
router.post('/reset', userAuth, async (req, res) => {
  try {
    await Preferences.deleteOne({ userId: req.user.userId });
    const preferences = new Preferences({ userId: req.user.userId });
    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

// Get default preferences (accessible to all authenticated users)
router.get('/defaults', userAuth, async (req, res) => {
  try {
    let preferences = await Preferences.findOne({ userId: 'default-user' });

    if (!preferences) {
      preferences = new Preferences({ userId: 'default-user' });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching default preferences:', error);
    res.status(500).json({ error: 'Failed to fetch default preferences' });
  }
});

module.exports = router;
