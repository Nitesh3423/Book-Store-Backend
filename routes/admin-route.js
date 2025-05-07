const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const adminAuth = require('../middlewares/admin-auth');

// Admin auth
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);

// Protected routes
router.get('/pending-sellers', adminAuth, adminController.getPendingSellers);
router.get('/approved-sellers', adminAuth, adminController.getApprovedSellers);
router.put('/approve-seller/:sellerId', adminAuth, adminController.approveSeller);
router.delete('/sellers/:sellerId', adminAuth, adminController.removeSeller);

module.exports = router;
