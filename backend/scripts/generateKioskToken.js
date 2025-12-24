#!/usr/bin/env node

/**
 * Generate a kiosk token for auto-login
 *
 * Usage:
 *   node scripts/generateKioskToken.js <username> <password>
 *
 * Outputs the token to stdout for use in kiosk scripts
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function connectDB() {
  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || 27017;
  const mongoUsername = process.env.MONGO_USERNAME;
  const mongoPassword = process.env.MONGO_PASSWORD;
  const mongoDatabase = process.env.MONGO_DATABASE || 'dashboard';

  let mongoURI;
  if (mongoUsername && mongoPassword) {
    mongoURI = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=admin`;
  } else {
    mongoURI = `mongodb://${mongoHost}:${mongoPort}/${mongoDatabase}`;
  }

  await mongoose.connect(mongoURI);
}

async function generateToken(username, password) {
  try {
    await connectDB();

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      console.error('Invalid password');
      process.exit(1);
    }

    // Generate a long-lived token for kiosk use (1 year)
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin || false
      },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    // Output just the token
    console.log(token);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/generateKioskToken.js <username> <password>');
  process.exit(1);
}

generateToken(args[0], args[1]);
