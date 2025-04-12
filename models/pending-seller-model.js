const mongoose = require('mongoose');

const pendingSellerSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  panCard: String,
  aadhaarCard: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PendingSeller', pendingSellerSchema);
