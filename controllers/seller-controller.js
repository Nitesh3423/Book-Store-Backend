const Seller = require('../models/seller-model'); 
const PendingSeller = require('../models/pending-seller-model');
const Product = require('../models/product-model');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Register seller (Pending)
exports.registerSeller = async (req, res) => {
  try {
    const { fullName, email, password, bankDetails, panCard, aadhaarCard, googleId } = req.body;

    const existing = await PendingSeller.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Seller request already submitted' });

    const pendingSeller = new PendingSeller({
      fullName,
      email,
      password,
      bankDetails,
      panCard,
      aadhaarCard,
      googleId
    });

    await pendingSeller.save();
    res.status(201).json({ success: true, message: 'Seller request submitted for approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error submitting request' });
  }
};

// Admin approves seller (moves from pending to approved)
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const pending = await PendingSeller.findById(sellerId);
    if (!pending) return res.status(404).json({ success: false, error: 'Pending seller not found' });

    const newSeller = new Seller({
      fullName: pending.fullName,
      email: pending.email,
      password: pending.password,
      googleId: pending.googleId,
      bankDetails: pending.bankDetails,
      panCard: pending.panCard,
      aadhaarCard: pending.aadhaarCard,
      registrationStatus: 'approved'
    });

    await newSeller.save();
    await PendingSeller.findByIdAndDelete(sellerId);

    res.json({ success: true, message: 'Seller approved and registered', sellerId: newSeller._id });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Approval failed' });
  }
};

// Seller login
exports.loginSeller = async (req, res) => {
  try {
    const { email, password, googleId } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });

    if (seller.registrationStatus !== 'approved')
      return res.status(403).json({ success: false, error: 'Seller not approved' });

    if (googleId && seller.googleId !== googleId)
      return res.status(400).json({ success: false, error: 'Google login failed' });

    if (!googleId && seller.password !== password)
      return res.status(400).json({ success: false, error: 'Invalid credentials' });

    // Generate token
    const token = jwt.sign(
      { sellerId: seller._id, role: 'seller' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Login error' });
  }
};

// Add product by seller
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      brand,
      category,
      subcategory,
      sku,
      price,
      discount,
      images,
      stock,
      specifications,
      variants,
      tags,
      shippingDetails,
      returnPolicy,
      isFeatured,
      isPublished,
      sellerId,
    } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller)
      return res.status(403).json({ success: false, error: 'Only approved sellers can add products' });

    const product = new Product({
      name,
      description,
      brand,
      category,
      subcategory,
      sku,
      price,
      discount,
      images,
      stock,
      specifications,
      variants,
      tags,
      shippingDetails,
      returnPolicy,
      isFeatured,
      isPublished,
      sellerId,
    });

    await product.save();
    res.status(201).json({ success: true, message: 'Product added', product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error adding product' });
  }
};
