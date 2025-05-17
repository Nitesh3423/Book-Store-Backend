const express = require("express");
const router = express.Router();
const productController = require("../controllers/product-controller");
const adminAuth = require("../middlewares/admin-auth");
const sellerAuth = require("../middlewares/seller-auth");

// Public routes
router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.get("/products/:id/related", productController.getRelatedProducts);

// Seller routes - require seller authentication
router.post("/sellers/products", sellerAuth, productController.createProduct);
router.put("/sellers/products/:id", sellerAuth, productController.updateProduct);
router.delete("/sellers/products/:id", sellerAuth, productController.deleteProduct);

// Admin routes - require admin authentication
router.get("/admin/products/pending", adminAuth, productController.getPendingProducts);
router.put("/admin/products/:id/approve", adminAuth, productController.approveProduct);
router.put("/admin/products/:id/reject", adminAuth, productController.rejectProduct);
router.delete("/admin/products/:id", adminAuth, productController.adminDeleteProduct);
router.put("/admin/products/:id", adminAuth, productController.updateProduct);

module.exports = router;
