require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Preferences = require('../models/Preferences');

const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

async function checkPreferences() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const allPrefs = await Preferences.find({});

    allPrefs.forEach(pref => {
      console.log('='.repeat(80));
      console.log(`User ID: ${pref.userId}`);
      console.log('='.repeat(80));
      console.log(JSON.stringify(pref, null, 2));
      console.log('\n');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPreferences();
