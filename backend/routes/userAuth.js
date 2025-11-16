const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const userAuth = require('../middleware/userAuth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validation
    if (!username || !password || !displayName) {
      return res.status(400).json({ message: 'Username, password, and display name are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ message: 'Username must be between 3 and 30 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already registered' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email ? email.toLowerCase() : undefined,
      passwordHash,
      displayName
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        displayName: user.displayName
      },
      JWT_SECRET,
      { expiresIn: '30d' } // 30 days for user tokens
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive. Contact administrator.' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        displayName: user.displayName
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user info (protected route)
router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user info' });
  }
});

// Verify token endpoint (checks if current token is still valid)
router.get('/verify', userAuth, async (req, res) => {
  // If middleware passes, token is valid
  res.json({
    valid: true,
    user: {
      id: req.user.userId,
      username: req.user.username,
      displayName: req.user.displayName
    }
  });
});

// Change password endpoint (protected)
router.post('/change-password', userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Find user
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// Update user profile (protected)
router.patch('/profile', userAuth, async (req, res) => {
  try {
    const { email, displayName } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update email if provided
    if (email !== undefined) {
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
          return res.status(409).json({ message: 'Email already in use' });
        }
        user.email = email.toLowerCase();
      }
    }

    // Update display name if provided
    if (displayName !== undefined && displayName.trim()) {
      user.displayName = displayName.trim();
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
