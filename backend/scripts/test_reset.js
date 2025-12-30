require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Preferences = require('../models/Preferences');

const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

async function testReset() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Get default preferences
    const defaultPrefs = await Preferences.findOne({ userId: 'default-user' });
    console.log('Default preferences:');
    console.log(`  disneyExcludedRides: ${defaultPrefs.disneyExcludedRides?.length || 0} rides`);
    console.log(`  countdownEvents: ${defaultPrefs.countdownEvents?.length || 0} events`);
    console.log('');

    // Get user preferences
    const userPrefs = await Preferences.findOne({ userId: { $ne: 'default-user' } });
    console.log(`User preferences (${userPrefs.userId}):`);
    console.log(`  disneyExcludedRides: ${userPrefs.disneyExcludedRides?.length || 0} rides`);
    console.log(`  countdownEvents: ${userPrefs.countdownEvents?.length || 0} events`);
    console.log('');

    // Simulate the reset operation
    console.log('Simulating reset to defaults...');
    userPrefs.disneyExcludedRides = defaultPrefs.disneyExcludedRides;
    userPrefs.disneyKnownRides = defaultPrefs.disneyKnownRides;
    await userPrefs.save();

    // Verify the save
    const verifyPrefs = await Preferences.findOne({ userId: userPrefs.userId });
    console.log('\nAfter reset:');
    console.log(`  disneyExcludedRides: ${verifyPrefs.disneyExcludedRides?.length || 0} rides`);
    console.log(`  countdownEvents: ${verifyPrefs.countdownEvents?.length || 0} events`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testReset();
