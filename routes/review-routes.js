const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review-controller');
const { authenticateUser } = require('../middlewares/auth-middleware');
const { authenticateSeller } = require('../middlewares/seller-auth-middleware');

// Public routes
router.get('/product/:productId', reviewController.getReviewsByProduct);

// User authenticated routes
router.post('/', authenticateUser, reviewController.createReview);
router.put('/:reviewId', authenticateUser, reviewController.updateReview);
router.delete('/:reviewId', authenticateUser, reviewController.deleteReview);
router.post('/:reviewId/vote', authenticateUser, reviewController.voteReview);

// Seller authenticated routes
router.get('/seller/products', authenticateSeller, reviewController.getReviewsBySellerProducts);

module.exports = router; 