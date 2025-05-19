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
    res.status(500).json({ error: 'Error submitting request' });
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
    const sellerId = req.sellerId;
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
      isPublished
    } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller)
      return res.status(403).json({ error: 'Only approved sellers can add products' });

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
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await product.save();
    res.status(201).json({ message: 'Product added', product });
  } catch (err) {
    res.status(500).json({ error: 'Error adding product' });
  }
};

exports.getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.sellerId).select('-password');
    res.json({ success: true, seller });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

// PUT /profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const updates = req.body;
    const updatedSeller = await Seller.findByIdAndUpdate(
      req.user.sellerId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, seller: updatedSeller });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// PUT /update-password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const seller = await Seller.findById(req.user.sellerId);
    const isMatch = await bcrypt.compare(currentPassword, seller.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Incorrect current password' });

    seller.password = await bcrypt.hash(newPassword, 10);
    await seller.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'Password update failed' });
  }
};

// GET /products
exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.sellerId });
    res.json({ success: true, products });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

// GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.user.sellerId });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
};

// PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user.sellerId },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, error: 'Product not found or unauthorized' });
    res.json({ success: true, product });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

// DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.user.sellerId,
    });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found or unauthorized' });
    res.json({ success: true, message: 'Product deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
};

// GET /orders
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'products.sellerId': req.user.sellerId }).populate('products.product');
    res.json({ success: true, orders });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

// GET /orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      'products.sellerId': req.user.sellerId,
    }).populate('products.product');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
};

// PUT /orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        'products.sellerId': req.user.sellerId,
      },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, error: 'Order not found or unauthorized' });
    res.json({ success: true, message: 'Order status updated', order });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
};

// GET /customers
exports.getSellerCustomers = async (req, res) => {
  try {
    const orders = await Order.find({ 'products.sellerId': req.user.sellerId }).populate('user');
    const customersMap = new Map();
    orders.forEach(order => {
      const user = order.user;
      if (user) customersMap.set(user._id.toString(), user);
    });

    res.json({ success: true, customers: Array.from(customersMap.values()) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};

// GET /transaction-stats
exports.getTransactionStats = async (req, res) => {
  try {
    const orders = await Order.find({ 'products.sellerId': req.user.sellerId });
    let totalRevenue = 0;
    let totalOrders = orders.length;

    orders.forEach(order => {
      order.products.forEach(p => {
        if (p.sellerId.toString() === req.user.sellerId) {
          totalRevenue += p.product.price * p.quantity;
        }
      });
    });

    res.json({ success: true, totalOrders, totalRevenue });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

// GET /dashboard/stats
exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;

    const [productCount, orders, totalRevenue] = await Promise.all([
      Product.countDocuments({ sellerId }),
      Order.find({ 'products.sellerId': sellerId }),
      Order.aggregate([
        { $unwind: "$products" },
        { $match: { "products.sellerId": sellerId } },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $multiply: ["$products.quantity", "$products.product.price"] } }
          }
        }
      ])
    ]);

    const revenue = totalRevenue[0]?.revenue || 0;

    res.json({
      success: true,
      stats: {
        productCount,
        orderCount: orders.length,
        totalRevenue: revenue
      }
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ success: false, error: "Failed to fetch dashboard stats" });
  }
};

exports.getWithdrawalStats = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;

    const [totalRequested, totalPaid] = await Promise.all([
      Withdrawal.aggregate([
        { $match: { sellerId, status: { $in: ["pending", "approved", "paid"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Withdrawal.aggregate([
        { $match: { sellerId, status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalRequested: totalRequested[0]?.total || 0,
        totalPaid: totalPaid[0]?.total || 0,
      }
    });
  } catch (err) {
    console.error("Error fetching withdrawal stats:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const sellerId = req.user.sellerId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid withdrawal amount" });
    }

    const withdrawal = new Withdrawal({
      sellerId,
      amount,
      status: "pending",
      requestedAt: new Date(),
    });

    await withdrawal.save();
    res.status(201).json({ success: true, message: "Withdrawal request submitted", withdrawal });
  } catch (err) {
    console.error("Error requesting withdrawal:", err);
    res.status(500).json({ success: false, error: "Failed to request withdrawal" });
  }
};

exports.getWithdrawalHistory = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;
    const withdrawals = await Withdrawal.find({ sellerId }).sort({ requestedAt: -1 });

    res.json({ success: true, withdrawals });
  } catch (err) {
    console.error("Error fetching withdrawal history:", err);
    res.status(500).json({ success: false, error: "Failed to fetch withdrawal history" });
  }
};
exports.cancelWithdrawalRequest = async (req, res) => {
  try {
    const sellerId = req.user.sellerId;
    const { id } = req.params;

    const withdrawal = await Withdrawal.findOne({ _id: id, sellerId });

    if (!withdrawal)
      return res.status(404).json({ success: false, error: "Withdrawal request not found" });

    if (withdrawal.status !== "pending")
      return res.status(400).json({ success: false, error: "Only pending requests can be cancelled" });

    withdrawal.status = "cancelled";
    await withdrawal.save();

    res.json({ success: true, message: "Withdrawal request cancelled" });
  } catch (err) {
    console.error("Error cancelling withdrawal:", err);
    res.status(500).json({ success: false, error: "Failed to cancel request" });
  }
};
