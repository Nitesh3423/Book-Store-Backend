const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller-controller');
const sellerAuth = require('../middlewares/seller-auth');

// Public seller routes
router.post('/register', sellerController.registerSeller);
router.post('/login', sellerController.loginSeller);
router.post('/logout', sellerController.logoutSeller);

// Protected seller routes
router.get('/profile', sellerAuth, sellerController.getSellerProfile);
router.put('/profile', sellerAuth, sellerController.updateSellerProfile);
router.put('/update-password', sellerAuth, sellerController.updatePassword);
router.get('/dashboard/stats', sellerAuth, sellerController.getSellerDashboardStats);
router.post('/add-product', sellerAuth, sellerController.addProduct);
router.get('/products', sellerAuth, sellerController.getSellerProducts);
router.get('/products/:id', sellerAuth, sellerController.getProductById);
router.put('/products/:id', sellerAuth, sellerController.updateProduct);
router.delete('/products/:id', sellerAuth, sellerController.deleteProduct);
router.get('/orders', sellerAuth, sellerController.getSellerOrders);
router.get('/orders/:id', sellerAuth, sellerController.getOrderById);
router.put('/orders/:id/status', sellerAuth, sellerController.updateOrderStatus);
router.get('/customers', sellerAuth, sellerController.getSellerCustomers);
router.get('/transaction-stats', sellerAuth, sellerController.getTransactionStats);

// Withdrawal related routes
router.get('/withdrawal-stats', sellerAuth, sellerController.getWithdrawalStats);
router.post('/request-withdrawal', sellerAuth, sellerController.requestWithdrawal);
router.get('/withdrawal-history', sellerAuth, sellerController.getWithdrawalHistory);
router.post('/cancel-withdrawal/:id', sellerAuth, sellerController.cancelWithdrawalRequest);

module.exports = router;
