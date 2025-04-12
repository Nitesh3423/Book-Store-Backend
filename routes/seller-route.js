const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller-controller');
const sellerAuth = require('../middlewares/seller-auth');

// Public seller routes
router.post('/register', sellerController.registerSeller);
router.post('/login', sellerController.loginSeller);

// Protected seller routes
router.post('/add-product', sellerAuth, sellerController.addProduct);

module.exports = router;
