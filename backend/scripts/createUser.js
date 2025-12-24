#!/usr/bin/env node

/**
 * Create a user account for the Dashboard app
 *
 * Usage:
 *   node scripts/createUser.js <username> <displayName> <password> [--admin]
 *
 * Example:
 *   node scripts/createUser.js leedy "Lee Dyer" mypassword --admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

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

async function createUser(username, displayName, password, isAdmin) {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if user exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      console.log(`User "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      displayName,
      passwordHash,
      isAdmin
    });

    await user.save();
    console.log(`User created successfully:`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Display Name: ${user.displayName}`);
    console.log(`  Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
    console.log(`  ID: ${user._id}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Parse arguments
const args = process.argv.slice(2);
const isAdmin = args.includes('--admin');
const filteredArgs = args.filter(a => a !== '--admin');

if (filteredArgs.length < 3) {
  console.log('Usage: node scripts/createUser.js <username> <displayName> <password> [--admin]');
  console.log('Example: node scripts/createUser.js leedy "Lee Dyer" mypassword --admin');
  process.exit(1);
}

const [username, displayName, password] = filteredArgs;
createUser(username, displayName, password, isAdmin);
