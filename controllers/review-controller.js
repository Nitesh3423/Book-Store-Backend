const ProductReview = require('../models/product-review-model');
const Product = require('../models/product-model');
const mongoose = require('mongoose');

// Get all reviews for a product
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const reviews = await ProductReview.find({ productId })
      .sort({ reviewDate: -1 }) // Most recent reviews first
      .populate('userId', 'name avatar'); // Get user name and avatar

    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get reviews by seller's products
exports.getReviewsBySellerProducts = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    
    // First get all products by this seller
    const sellerProducts = await Product.find({ sellerId });
    const productIds = sellerProducts.map(product => product._id);
    
    // Then get all reviews for these products
    const reviews = await ProductReview.find({ productId: { $in: productIds } })
      .sort({ reviewDate: -1 })
      .populate('userId', 'name avatar')
      .populate('productId', 'name images');
    
    return res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching seller product reviews:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add a new review
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, reviewText, aspects, reviewImages } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    // Check if user has already reviewed this product
    const existingReview = await ProductReview.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Create the review
    const newReview = new ProductReview({
      productId,
      userId,
      rating,
      title,
      reviewText,
      authorName: req.user.name,
      authorLocation: req.user.location || 'Unknown',
      aspects: aspects || [],
      reviewImages: reviewImages || [],
      // Check if user has purchased this product (in a real app)
      verifiedPurchase: true, // This would be determined by order history
    });

    const savedReview = await newReview.save();

    // Update product ratings
    const product = await Product.findById(productId);
    if (product) {
      const allProductReviews = await ProductReview.find({ productId });
      const totalRating = allProductReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allProductReviews.length;
      
      product.ratings = {
        average: parseFloat(averageRating.toFixed(1)),
        count: allProductReviews.length
      };
      await product.save();
    }

    return res.status(201).json({ success: true, review: savedReview });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, reviewText, aspects, reviewImages } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    // Find the review
    const review = await ProductReview.findById(reviewId);
    
    // Check if review exists
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own reviews' });
    }

    // Update the review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.reviewText = reviewText || review.reviewText;
    if (aspects) review.aspects = aspects;
    if (reviewImages) review.reviewImages = reviewImages;
    
    const updatedReview = await review.save();

    // Update product ratings
    const productId = review.productId;
    const product = await Product.findById(productId);
    if (product) {
      const allProductReviews = await ProductReview.find({ productId });
      const totalRating = allProductReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allProductReviews.length;
      
      product.ratings = {
        average: parseFloat(averageRating.toFixed(1)),
        count: allProductReviews.length
      };
      await product.save();
    }

    return res.status(200).json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    // Find the review
    const review = await ProductReview.findById(reviewId);
    
    // Check if review exists
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user owns the review or is admin
    if (review.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
    }

    // Store productId before deleting
    const productId = review.productId;

    // Delete the review
    await ProductReview.findByIdAndDelete(reviewId);

    // Update product ratings
    const product = await Product.findById(productId);
    if (product) {
      const allProductReviews = await ProductReview.find({ productId });
      if (allProductReviews.length > 0) {
        const totalRating = allProductReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / allProductReviews.length;
        
        product.ratings = {
          average: parseFloat(averageRating.toFixed(1)),
          count: allProductReviews.length
        };
      } else {
        // No reviews left
        product.ratings = {
          average: 0,
          count: 0
        };
      }
      await product.save();
    }

    return res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Vote on a review (helpful/not helpful)
exports.voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { voteType } = req.body; // 'helpful' or 'notHelpful'
    
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID format' });
    }

    if (voteType !== 'helpful' && voteType !== 'notHelpful') {
      return res.status(400).json({ success: false, message: 'Invalid vote type' });
    }

    // Find the review
    const review = await ProductReview.findById(reviewId);
    
    // Check if review exists
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Update the vote count
    if (voteType === 'helpful') {
      review.helpfulVotes += 1;
    } else {
      review.notHelpfulVotes += 1;
    }

    const updatedReview = await review.save();

    return res.status(200).json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Error voting on review:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}; 