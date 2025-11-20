const mongoose = require('mongoose');
require('dotenv').config();

const AdminCredentials = require('../models/AdminCredentials');

const insertAdmin = async () => {
  try {
    const { MONGO_HOST, MONGO_PORT, MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE } = process.env;

    // Connect with authSource=admin
    const mongoURI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT || 27017}/${MONGO_DATABASE}?authSource=admin`;

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin if any
    await AdminCredentials.deleteMany({ username: 'admin' });

    // Insert new admin with pre-hashed password
    const admin = new AdminCredentials({
      username: 'admin',
      passwordHash: '$2b$10$SWTX23d2sJL90UK4vgDwTeYSCoj8rbnkJ9PYNtGhNeYYFepRchmeO',
      email: ''
    });

    await admin.save();

    console.log('✅ Admin account created successfully!\n');
    console.log('📝 Admin Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Dashboard2024!');
    console.log('\n🌐 Access the admin panel at: /admin/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

insertAdmin();
