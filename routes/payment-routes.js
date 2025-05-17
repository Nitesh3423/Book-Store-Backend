const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment-controller');
const userAuth=require("../middlewares/user-auth");

router.post("/create-order", userAuth, paymentController.createRazorpayOrder);
router.post("/verify", userAuth, paymentController.verifyRazorpayPayment);

module.exports = router;
