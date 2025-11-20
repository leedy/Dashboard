#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGO_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

async function checkTmdbKey() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully\n');

    const Preferences = require('../models/Preferences');
    const systemPrefs = await Preferences.findOne({ userId: 'default-user' });

    if (!systemPrefs) {
      console.log('❌ No system preferences found');
      console.log('   TMDb API key needs to be configured in Admin Panel → System Settings');
    } else if (!systemPrefs.tmdbApiKey) {
      console.log('❌ TMDb API key is NOT configured');
      console.log('   Please configure it in Admin Panel → System Settings');
    } else {
      const keyPreview = systemPrefs.tmdbApiKey.substring(0, 8) + '...' + systemPrefs.tmdbApiKey.substring(systemPrefs.tmdbApiKey.length - 4);
      console.log('✓ TMDb API key is configured');
      console.log(`  Key: ${keyPreview}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkTmdbKey();
