const express = require('express');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all registered users (protected admin route)
router.get('/users', adminAuth, async (req, res) => {
  try {
    // Fetch all users, exclude password hash, sorted by creation date (newest first)
    const users = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Format user data for response
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email || 'N/A',
      displayName: user.displayName,
      isActive: user.isActive,
      isAdmin: user.isAdmin || false,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      users: formattedUsers,
      totalCount: formattedUsers.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Toggle user admin status (protected admin route)
router.patch('/users/:userId/admin', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'isAdmin must be a boolean value' });
    }

    // Find and update the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If trying to remove admin status, check if this is the last admin
    if (user.isAdmin && !isAdmin) {
      const adminCount = await User.countDocuments({ isAdmin: true });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot remove admin status from the last admin user. There must always be at least one admin.',
          isLastAdmin: true
        });
      }
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({
      message: 'User admin status updated successfully',
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Toggle admin error:', error);
    res.status(500).json({ message: 'Server error updating user admin status' });
  }
});

module.exports = router;
