const mongoose = require('mongoose');
require('dotenv').config();

const Preferences = require('../models/Preferences');

async function resetDisneyRides() {
  try {
    const { MONGO_HOST, MONGO_PORT, MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE } = process.env;
    const mongoURI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT || 27017}/${MONGO_DATABASE}?authSource=admin`;

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Reset disneyExcludedRides to empty array for all users
    const result = await Preferences.updateMany(
      {},
      {
        $set: {
          disneyExcludedRides: [],
          disneyKnownRides: []
        }
      }
    );

    console.log(`✅ Reset Disney excluded rides for ${result.modifiedCount} user(s)\n`);
    console.log('All Disney rides are now visible for all users.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetDisneyRides();
