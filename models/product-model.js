const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  brand: { type: String },
  category: { type: String },
  subcategory: { type: String },
  sku: { type: String, unique: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  images: [
    {
      url: String,
      altText: String,
    },
  ],
  stock: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  specifications: {
    color: String,
    size: String,
    weight: String,
    material: String,
    batteryLife: String,
    warranty: String,
  },
  variants: [
    {
      variantName: String,
      sku: String,
      price: Number,
      stock: Number,
    },
  ],
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  shippingDetails: {
    weight: String,
    dimensions: String,
    availableRegions: [String],
  },
  returnPolicy: String,
  isFeatured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  approvalDate: { type: Date },
  approvalNote: { type: String }
});

module.exports = mongoose.model('Product', productSchema);
