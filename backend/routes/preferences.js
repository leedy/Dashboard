const express = require('express');
const router = express.Router();
const Preferences = require('../models/Preferences');
const userAuth = require('../middleware/userAuth');

// Get preferences for the authenticated user
router.get('/', userAuth, async (req, res) => {
  try {
    let preferences = await Preferences.findOne({ userId: req.user.userId });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = new Preferences({ userId: req.user.userId });
      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preferences for the authenticated user
router.put('/', userAuth, async (req, res) => {
  try {
    console.log('Updating preferences with:', JSON.stringify(req.body, null, 2));
    let preferences = await Preferences.findOne({ userId: req.user.userId });

    if (!preferences) {
      // Create new preferences if they don't exist
      preferences = new Preferences({
        userId: req.user.userId,
        ...req.body
      });
    } else {
      // Update existing preferences
      Object.assign(preferences, req.body);
    }

    await preferences.save();
    console.log('Preferences saved successfully');
    res.json(preferences);
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

module.exports = router;
