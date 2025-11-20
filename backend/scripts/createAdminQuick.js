#!/usr/bin/env node

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config();

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

const createAdmin = async () => {
  try {
    console.log('\n🔐 Creating Admin Account\n');

    await connectDB();

    // Get password from command line argument or use default
    const password = process.argv[2] || 'admin123';

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long.');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await AdminCredentials.findOne({ username: 'admin' });

    // Hash password
    console.log('🔒 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

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

    console.log('\n📝 Admin Login Credentials:');
    console.log('   Username: admin');
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Access the admin panel at: /admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
