const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminCredentials = require('../models/AdminCredentials');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Find admin credentials (there should only be one admin user)
    const admin = await AdminCredentials.findOne({ username: 'admin' });

    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found. Please run setup script first.' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      {
        username: admin.username,
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      username: admin.username
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify token endpoint (checks if current token is still valid)
router.get('/verify', adminAuth, async (req, res) => {
  // If middleware passes, token is valid
  res.json({
    valid: true,
    username: req.admin.username
  });
});

// Change password endpoint (protected)
router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Find admin
    const admin = await AdminCredentials.findOne({ username: 'admin' });

    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    admin.passwordHash = newPasswordHash;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

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

module.exports = router;
