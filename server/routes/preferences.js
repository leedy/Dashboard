const express = require('express');
const router = express.Router();
const Preferences = require('../models/Preferences');

// Get preferences for the default user
router.get('/', async (req, res) => {
  try {
    let preferences = await Preferences.findOne({ userId: 'default-user' });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = new Preferences({ userId: 'default-user' });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preferences for the default user
router.put('/', async (req, res) => {
  try {
    let preferences = await Preferences.findOne({ userId: 'default-user' });

    if (!preferences) {
      // Create new preferences if they don't exist
      preferences = new Preferences({
        userId: 'default-user',
        ...req.body
      });
    } else {
      // Update existing preferences
      Object.assign(preferences, req.body);
    }

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Reset preferences to defaults
router.post('/reset', async (req, res) => {
  try {
    await Preferences.deleteOne({ userId: 'default-user' });
    const preferences = new Preferences({ userId: 'default-user' });
    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

module.exports = router;
