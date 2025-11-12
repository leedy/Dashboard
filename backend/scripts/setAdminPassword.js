#!/usr/bin/env node

const readline = require('readline');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the AdminCredentials model
const AdminCredentials = require('../models/AdminCredentials');

// MongoDB connection
const connectDB = async () => {
  try {
    const { MONGO_HOST, MONGO_PORT, MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE } = process.env;

    if (!MONGO_HOST || !MONGO_DATABASE) {
      throw new Error('Missing required MongoDB configuration in .env file');
    }

    let mongoURI;
    if (MONGO_USERNAME && MONGO_PASSWORD) {
      mongoURI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT || 27017}/${MONGO_DATABASE}`;
    } else {
      mongoURI = `mongodb://${MONGO_HOST}:${MONGO_PORT || 27017}/${MONGO_DATABASE}`;
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Main function
const setupAdminPassword = async () => {
  try {
    console.log('\n🔐 Dashboard Admin Password Setup\n');
    console.log('This script will create or update the admin account password.\n');

    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await AdminCredentials.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists.');
      const confirm = await question('Do you want to RESET the admin password? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes') {
        console.log('\n❌ Setup cancelled.');
        rl.close();
        process.exit(0);
      }
      console.log('');
    }

    // Get new password
    const password = await question('Enter admin password (min 6 characters): ');

    if (!password || password.length < 6) {
      console.log('\n❌ Password must be at least 6 characters long.');
      rl.close();
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await question('Confirm admin password: ');

    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match.');
      rl.close();
      process.exit(1);
    }

    // Hash password
    console.log('\n🔒 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save or update admin credentials
    if (existingAdmin) {
      existingAdmin.passwordHash = passwordHash;
      await existingAdmin.save();
      console.log('✅ Admin password updated successfully!');
    } else {
      const admin = new AdminCredentials({
        username: 'admin',
        passwordHash,
        email: ''
      });
      await admin.save();
      console.log('✅ Admin account created successfully!');
    }

    console.log('\n📝 You can now login to the admin panel with your password.');
    console.log('');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
};

// Run the setup
setupAdminPassword();
