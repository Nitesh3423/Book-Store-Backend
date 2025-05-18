const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  getProfile,
  updateProfile,
  addToCart,
  placeOrder,
  getOrders,
  getCart,
  removeFromCart,
  updateCartItem,
  addToWishlist,
  getWishlist,
  removeFromWishlist
} = require("../controllers/user-controller");
const userAuth = require("../middlewares/user-auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

// Profile routes
router.get("/profile", userAuth, getProfile);
router.put("/profile", userAuth, updateProfile);

// Cart routes
router.post("/cart", userAuth, addToCart);
router.get("/get-cart", userAuth, getCart);
router.delete("/cart/:productId", userAuth, removeFromCart);
router.put("/cart/:productId", userAuth, updateCartItem);

// Wishlist routes
router.post("/wishlist", userAuth, addToWishlist);
router.get("/wishlist", userAuth, getWishlist);
router.delete("/wishlist/:productId", userAuth, removeFromWishlist);

// Orders
router.post("/orders", userAuth, placeOrder);
router.get("/orders", userAuth, getOrders);

module.exports = router;
