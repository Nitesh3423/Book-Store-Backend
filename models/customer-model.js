const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  purchaseHistory: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Order" }
  ],
  totalSpent: { type: Number, default: 0 },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Customer", customerSchema); 