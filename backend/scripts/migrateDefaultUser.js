#!/usr/bin/env node

/**
 * Migration Script: Migrate default-user data to a real user account
 *
 * This script:
 * 1. Creates a new user account (or uses existing)
 * 2. Migrates all 'default-user' preferences to the new user
 * 3. Migrates all photos to the new user
 * 4. Optionally updates usage events
 *
 * Usage:
 *   node scripts/migrateDefaultUser.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');
const User = require('../models/User');
const Preferences = require('../models/Preferences');
const Photo = require('../models/Photo');
const UsageEvent = require('../models/UsageEvent');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function connectDB() {
  try {
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
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateData() {
  try {
    console.log('\n=== Default User Migration Tool ===\n');

    // Check if default-user data exists
    const defaultPrefs = await Preferences.findOne({ userId: 'default-user' });
    const defaultPhotos = await Photo.find({
      userId: { $exists: false },
      category: { $ne: 'dashboard-assets' } // Don't count system assets
    });
    const defaultDashboardAssets = await Photo.countDocuments({
      userId: { $exists: false },
      category: 'dashboard-assets'
    });
    const defaultUsageEvents = await UsageEvent.countDocuments({ userId: 'default-user' });

    console.log('Found existing data:');
    console.log(`  - Preferences: ${defaultPrefs ? 'Yes' : 'No'}`);
    console.log(`  - Personal Photos: ${defaultPhotos.length} photos`);
    console.log(`  - Dashboard Assets: ${defaultDashboardAssets} assets (will be converted to system-wide)`);
    console.log(`  - Usage Events: ${defaultUsageEvents} events`);

    if (!defaultPrefs && defaultPhotos.length === 0 && defaultUsageEvents === 0) {
      console.log('\n✓ No default-user data found. Migration not needed.');
      return;
    }

    console.log('\n--- Create/Select User Account ---\n');

    // Ask if they want to create a new user or use existing
    const createNew = await question('Create new user account? (y/n): ');

    let targetUserId;

    if (createNew.toLowerCase() === 'y') {
      // Create new user
      const username = await question('Enter username: ');
      const displayName = await question('Enter display name: ');
      const email = await question('Enter email (optional, press enter to skip): ');
      const password = await question('Enter password: ');

      // Check if user exists
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        console.log('✗ User already exists with that username');
        process.exit(1);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const newUser = new User({
        username: username.toLowerCase(),
        email: email || undefined,
        passwordHash,
        displayName
      });

      await newUser.save();
      targetUserId = newUser._id.toString();
      console.log(`\n✓ Created user: ${username} (ID: ${targetUserId})`);
    } else {
      // Use existing user
      const username = await question('Enter existing username: ');
      const user = await User.findOne({ username: username.toLowerCase() });

      if (!user) {
        console.log('✗ User not found');
        process.exit(1);
      }

      targetUserId = user._id.toString();
      console.log(`\n✓ Using user: ${user.username} (ID: ${targetUserId})`);
    }

    console.log('\n--- Migrating Data ---\n');

    // Migrate preferences
    if (defaultPrefs) {
      const existingPrefs = await Preferences.findOne({ userId: targetUserId });

      if (existingPrefs) {
        console.log('! User already has preferences. Skipping preferences migration.');
      } else {
        // Update userId
        defaultPrefs.userId = targetUserId;
        await defaultPrefs.save();
        console.log('✓ Migrated preferences');
      }
    }

    // Migrate personal photos (family-photos and event-slides)
    if (defaultPhotos.length > 0) {
      const result = await Photo.updateMany(
        {
          userId: { $exists: false },
          category: { $ne: 'dashboard-assets' }
        },
        { $set: { userId: targetUserId } }
      );
      console.log(`✓ Migrated ${result.modifiedCount} personal photos to user`);
    }

    // Convert dashboard-assets to system-wide
    if (defaultDashboardAssets > 0) {
      const result = await Photo.updateMany(
        {
          userId: { $exists: false },
          category: 'dashboard-assets'
        },
        { $set: { userId: 'system' } }
      );
      console.log(`✓ Converted ${result.modifiedCount} dashboard assets to system-wide`);
    }

    // Ask about usage events
    if (defaultUsageEvents > 0) {
      const migrateUsage = await question(`Migrate ${defaultUsageEvents} usage events? (y/n): `);

      if (migrateUsage.toLowerCase() === 'y') {
        const result = await UsageEvent.updateMany(
          { userId: 'default-user' },
          { $set: { userId: targetUserId } }
        );
        console.log(`✓ Migrated ${result.modifiedCount} usage events`);
      } else {
        console.log('- Skipped usage events migration');
      }
    }

    console.log('\n=== Migration Complete! ===\n');
    console.log(`All data has been migrated to user: ${targetUserId}`);
    console.log('You can now log in with the created/selected user account.\n');

  } catch (error) {
    console.error('\n✗ Migration error:', error);
    process.exit(1);
  }
}

async function main() {
  await connectDB();
  await migrateData();
  rl.close();
  mongoose.connection.close();
  process.exit(0);
}

main();
