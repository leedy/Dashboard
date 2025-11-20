#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

async function clearUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully');

    // Get the User model
    const User = require('../models/User');

    // Count users before deletion
    const countBefore = await User.countDocuments();
    console.log(`Found ${countBefore} users`);

    if (countBefore === 0) {
      console.log('No users to delete');
    } else {
      // Delete all users
      const result = await User.deleteMany({});
      console.log(`Deleted ${result.deletedCount} users`);
    }

    // Verify deletion
    const countAfter = await User.countDocuments();
    console.log(`Users remaining: ${countAfter}`);

    console.log('\n✓ User data cleared successfully');
    console.log('You can now test first-user admin setup');

  } catch (error) {
    console.error('Error clearing users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

clearUsers();
