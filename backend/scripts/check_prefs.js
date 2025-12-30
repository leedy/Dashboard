require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Preferences = require('../models/Preferences');

const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

async function checkPreferences() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const allPrefs = await Preferences.find({}, {
      userId: 1,
      disneyExcludedRides: 1,
      disneyKnownRides: 1,
      countdownEvents: 1
    });

    console.log('\n=== All User Preferences ===\n');
    allPrefs.forEach(pref => {
      console.log(`User ID: ${pref.userId}`);
      console.log(`  Disney Excluded Rides: ${pref.disneyExcludedRides?.length || 0} rides`);
      console.log(`  Disney Known Rides: ${pref.disneyKnownRides?.length || 0} rides`);
      console.log(`  Countdown Events: ${pref.countdownEvents?.length || 0} events`);
      if (pref.disneyExcludedRides && pref.disneyExcludedRides.length > 0) {
        console.log(`  Excluded IDs (first 10): ${pref.disneyExcludedRides.slice(0, 10).join(', ')}`);
      }
      if (pref.countdownEvents && pref.countdownEvents.length > 0) {
        console.log(`  Countdowns:`, pref.countdownEvents.map(e => `${e.name} (${e.date})`).join(', '));
      }
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPreferences();
