const mongoose = require('mongoose');

const adminCredentialsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    default: 'admin'
  },
  passwordHash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminCredentials', adminCredentialsSchema);
