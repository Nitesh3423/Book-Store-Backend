const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productReviewSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  title: {
    type: String,
    maxlength: 100,
  },
  reviewText: {
    type: String,
    maxlength: 3000,
  },
  reviewDate: {
    type: Date,
    default: Date.now,
  },
  authorName: {
    type: String,
  },
  authorLocation: {
    type: String,
  },
  verifiedPurchase: {
    type: Boolean,
    default: false,
  },
  helpfulVotes: {
    type: Number,
    default: 0,
  },
  notHelpfulVotes: {
    type: Number,
    default: 0,
  },
  reviewImages: [
    {
      type: String, // URL of uploaded images
    },
  ],
  aspects: [
    {
      aspectName: {
        type: String, // e.g., "Camera", "Battery", "Display"
      },
      aspectRating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
  ],
});

module.exports = mongoose.model('ProductReview', productReviewSchema); 