const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  panCard: String,
  aadhaarCard: String,
  registrationStatus: {
    type: String,
    enum: ["approved"],
    default: "approved",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

module.exports = mongoose.model("Seller", sellerSchema);
