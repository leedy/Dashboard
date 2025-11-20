const mongoose = require('mongoose');
require('dotenv').config({ path: '/home/leedy/Dashboard/backend/.env' });

const Preferences = require('/home/leedy/Dashboard/backend/models/Preferences');

async function checkPreferences() {
  try {
    const { MONGO_HOST, MONGO_PORT, MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE } = process.env;
    const mongoURI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT || 27017}/${MONGO_DATABASE}?authSource=admin`;

    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB\n');

    const prefs = await Preferences.find({}, { userId: 1, disneyExcludedRides: 1 });

    console.log('Disney Excluded Rides by User:');
    console.log('================================\n');

    prefs.forEach(pref => {
      console.log(`User: ${pref.userId}`);
      console.log(`Excluded Rides Count: ${pref.disneyExcludedRides?.length || 0}`);
      if (pref.disneyExcludedRides && pref.disneyExcludedRides.length > 0) {
        console.log(`Excluded Ride IDs: ${pref.disneyExcludedRides.slice(0, 10).join(', ')}${pref.disneyExcludedRides.length > 10 ? '...' : ''}`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPreferences();
