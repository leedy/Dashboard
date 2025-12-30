require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Preferences = require('../models/Preferences');

const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

async function checkCountdowns() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const userPrefs = await Preferences.findOne({ userId: { $ne: 'default-user' } });

    console.log('User countdown data:');
    console.log('  countdownEvent (legacy):', userPrefs.countdownEvent);
    console.log('  countdownEvents (new):', userPrefs.countdownEvents);
    console.log('\nFull preferences object:');
    console.log(JSON.stringify(userPrefs, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCountdowns();
