const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  profileImage: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  panCard: String,
  aadhaarCard: String,
  storeInfo: {
    storeName: String,
    description: String,
    logo: String,
    bannerImage: String,
    contactEmail: String,
    contactPhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  stats: {
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 }
  },
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
