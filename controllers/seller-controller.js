const Seller = require('../models/seller-model');
const PendingSeller = require('../models/pending-seller-model');
const Product = require('../models/product-model');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const mongoose = require('mongoose');
const Withdrawal = require('../models/withdrawal-model');

// Register seller (Pending)
exports.registerSeller = async (req, res) => {
  try {
    const { fullName, email, password, bankDetails, panCard, aadhaarCard, googleId } = req.body;

    const existing = await PendingSeller.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Seller request already submitted' });

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
    res.status(201).json({ message: 'Seller request submitted for approval' });
  } catch (err) {
    res.status(500).json({ error: 'Error submitting request' });
  }
};

// Admin approves seller (moves from pending to approved)
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const pending = await PendingSeller.findById(sellerId);
    if (!pending) return res.status(404).json({ error: 'Pending seller not found' });

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

    res.json({ message: 'Seller approved and registered', sellerId: newSeller._id });
  } catch (err) {
    res.status(500).json({ error: 'Approval failed' });
  }
};

// Seller login
exports.loginSeller = async (req, res) => {
    try {
      const { email, password, googleId } = req.body;
  
      const seller = await Seller.findOne({ email });
      if (!seller) return res.status(404).json({ error: 'Seller not found' });
  
      if (seller.registrationStatus !== 'approved')
        return res.status(403).json({ error: 'Seller not approved' });
  
      if (googleId && seller.googleId !== googleId)
        return res.status(400).json({ error: 'Google login failed' });
  
      if (!googleId && seller.password !== password)
        return res.status(400).json({ error: 'Invalid credentials' });
  
      // Generate token
      const token = jwt.sign(
        { sellerId: seller._id, role: 'seller' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.json({ message: 'Login successful', token });
    } catch (err) {
      res.status(500).json({ error: 'Login error' });
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
    if (!seller) {
      return res.status(403).json({ error: 'Only approved sellers can add products' });
    }

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
    res.status(201).json({ 
      message: 'Product added successfully and pending approval', 
      product 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error adding product: ' + err.message });
  }
};

// Get seller profile
exports.getSellerProfile = async (req, res) => {
  try {
    // The seller ID comes from the auth middleware
    const sellerId = req.sellerId;
    
    const seller = await Seller.findById(sellerId)
      .select('-password'); // Exclude password from the response
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seller profile' });
  }
};

// Get seller dashboard statistics
exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    
    // Get Order model
    let Order, Customer;
    try {
      Order = mongoose.model('Order');
      Customer = mongoose.model('Customer');
    } catch (err) {
      // Return mock data if models aren't registered yet
      return res.json({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        productsByCategory: { 'Fiction': 0, 'Non-Fiction': 0 },
        revenueByMonth: [
          { name: 'Jan', revenue: 0 },
          { name: 'Feb', revenue: 0 },
          { name: 'Mar', revenue: 0 },
          { name: 'Apr', revenue: 0 },
          { name: 'May', revenue: 0 },
          { name: 'Jun', revenue: 0 }
        ],
        recentOrders: [],
        recentProducts: []
      });
    }
    
    // Get total products count
    const totalProducts = await Product.countDocuments({ sellerId });
    
    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Format products by category
    const productsByCategoryObj = {};
    productsByCategory.forEach(item => {
      if (item._id) {
        productsByCategoryObj[item._id] = item.count;
      }
    });
    
    // Get total orders and pending orders
    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let totalCustomers = 0;
    let recentOrders = [];
    let monthlyRevenue = [];
    
    try {
      totalOrders = await Order.countDocuments({ sellerId });
      pendingOrders = await Order.countDocuments({ 
        sellerId, 
        status: { $in: ['Pending', 'Processing'] }
      });
      
      // Get total revenue
      const revenueData = await Order.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]);
      
      totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
      
      // Get total customers
      totalCustomers = await Customer.countDocuments({ sellerId });
      
      // Get revenue by month for the last 6 months
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      monthlyRevenue = await Order.aggregate([
        { 
          $match: { 
            sellerId: new mongoose.Types.ObjectId(sellerId),
            createdAt: { $gte: sixMonthsAgo }
          } 
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      
      // Get recent orders
      recentOrders = await Order.find({ sellerId })
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (err) {
      // Continue with zeros if there's an error
    }
    
    // Format monthly revenue data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = [];
    
    // First create entries for all 6 months with 0 revenue
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(today.getMonth() - 5 + i);
      
      revenueByMonth.push({
        name: monthNames[date.getMonth()],
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        revenue: 0
      });
    }
    
    // Then fill in actual revenue data
    monthlyRevenue.forEach(item => {
      const month = item._id.month;
      const year = item._id.year;
      
      const existingIndex = revenueByMonth.findIndex(
        entry => entry.month === month && entry.year === year
      );
      
      if (existingIndex !== -1) {
        revenueByMonth[existingIndex].revenue = item.revenue;
      }
    });
    
    // Get recent products
    const recentProducts = await Product.find({ sellerId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Update seller stats
    try {
      await Seller.findByIdAndUpdate(sellerId, {
        $set: {
          'stats.totalRevenue': totalRevenue,
          'stats.totalOrders': totalOrders,
          'stats.totalProducts': totalProducts,
          'stats.totalCustomers': totalCustomers,
          updatedAt: new Date()
        }
      });
    } catch (err) {
      // Continue even if stats update fails
    }
    
    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalCustomers,
      productsByCategory: productsByCategoryObj,
      revenueByMonth,
      recentOrders,
      recentProducts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Seller logout
exports.logoutSeller = async (req, res) => {
  try {
    // In a stateless JWT authentication, the client is responsible for removing the token
    // This endpoint is mostly a formality
    res.json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const {
      fullName,
      profileImage,
      bankDetails,
      storeInfo
    } = req.body;

    // Find the seller and update
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      {
        $set: {
          fullName: fullName,
          profileImage: profileImage,
          bankDetails: bankDetails,
          storeInfo: storeInfo,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      seller: updatedSeller
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Update seller password
exports.updatePassword = async (req, res) => {
  try {
    const sellerId = req.sellerId || req.seller._id;
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get seller with password
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Verify current password
    if (seller.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    seller.password = newPassword;
    seller.updatedAt = new Date();
    await seller.save();

    res.json({
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Get all seller products with pagination and filtering
exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest',
      category,
      approvalStatus,
      search
    } = req.query;

    // Build query
    const query = { sellerId };
    
    // Add filters if provided
    if (category) query.category = category;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort options
    let sortOptions = {};
    switch (sort) {
      case 'priceAsc':
        sortOptions = { price: 1 };
        break;
      case 'priceDesc':
        sortOptions = { price: -1 };
        break;
      case 'alphabetical':
        sortOptions = { name: 1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        totalProducts,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.sellerId;
    
    const product = await Product.findOne({ _id: id, sellerId });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.sellerId;
    const productData = req.body;
    
    // Add updated timestamp
    productData.updatedAt = new Date();
    
    // Set approval status to pending if critical fields are updated
    const criticalFields = ['name', 'description', 'price', 'category'];
    const product = await Product.findOne({ _id: id, sellerId });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let shouldResetApproval = false;
    for (const field of criticalFields) {
      if (productData[field] && productData[field] !== product[field]) {
        shouldResetApproval = true;
        break;
      }
    }
    
    if (shouldResetApproval) {
      productData.approvalStatus = 'pending';
    }
    
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, sellerId },
      { $set: productData },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.sellerId;
    
    const result = await Product.findOneAndDelete({ _id: id, sellerId });
    
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Get seller orders with pagination and filtering
exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest',
      status,
      search,
      startDate,
      endDate
    } = req.query;

    // Get Order model
    let Order;
    try {
      Order = mongoose.model('Order');
    } catch (err) {
      // Return empty data if model isn't registered
      return res.json({
        orders: [],
        pagination: {
          totalOrders: 0,
          currentPage: parseInt(page),
          totalPages: 0,
          limit: parseInt(limit)
        }
      });
    }

    // Build query
    const query = { sellerId };
    
    // Add filters if provided
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort options
    let sortOptions = {};
    switch (sort) {
      case 'amountAsc':
        sortOptions = { totalAmount: 1 };
        break;
      case 'amountDesc':
        sortOptions = { totalAmount: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .catch(() => {
        return [];
      });
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query)
      .catch(() => {
        return 0;
      });
    
    res.json({
      orders,
      pagination: {
        totalOrders,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)) || 0,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const orderId = req.params.id;

    // Get Order model
    let Order;
    try {
      Order = mongoose.model('Order');
    } catch (err) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the order that belongs to this seller
    const order = await Order.findOne({ _id: orderId, sellerId })
      .populate('user', 'name email')
      .catch(() => {
        return null;
      });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status value
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Get Order model
    let Order;
    try {
      Order = mongoose.model('Order');
    } catch (err) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find and update the order
    const order = await Order.findOneAndUpdate(
      { _id: orderId, sellerId },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).catch(() => {
      return null;
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Get seller customers
exports.getSellerCustomers = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const { 
      page = 1, 
      limit = 10, 
      sort = 'newest',
      search
    } = req.query;

    // Get Customer model
    let Customer;
    try {
      Customer = mongoose.model('Customer');
    } catch (err) {
      // Return empty data if model isn't registered
      return res.json({
        customers: [],
        pagination: {
          totalCustomers: 0,
          currentPage: parseInt(page),
          totalPages: 0,
          limit: parseInt(limit)
        }
      });
    }

    // Build query
    const query = { sellerId };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort options
    let sortOptions = {};
    switch (sort) {
      case 'nameAsc':
        sortOptions = { name: 1 };
        break;
      case 'nameDesc':
        sortOptions = { name: -1 };
        break;
      case 'spentDesc':
        sortOptions = { totalSpent: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .catch(() => {
        return [];
      });
    
    // Get total count for pagination
    const totalCustomers = await Customer.countDocuments(query)
      .catch(() => {
        return 0;
      });
    
    res.json({
      customers,
      pagination: {
        totalCustomers,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCustomers / parseInt(limit)) || 0,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const { timeframe } = req.query;

    // Define the date range based on timeframe
    let startDate = new Date(0); // Default to beginning of time
    const endDate = new Date();

    if (timeframe === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get Order model
    let Order;
    try {
      Order = mongoose.model('Order');
    } catch (err) {
      // Return empty data if model isn't registered
      return res.json({
        totalAmount: 0,
        transactionCount: 0,
        avgOrderValue: 0,
        mostPopularProduct: { name: '', count: 0 },
        monthlyRevenue: []
      });
    }

    // Get all completed transactions within the date range
    const transactions = await Order.find({
      sellerId,
      status: 'Delivered',
      paymentStatus: 'Completed',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('products.product').catch(() => {
      return [];
    });

    // Calculate total revenue
    const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    
    // Calculate average order value
    const avgOrderValue = transactions.length ? totalAmount / transactions.length : 0;
    
    // Find most popular product
    const productCounts = {};
    transactions.forEach(transaction => {
      transaction.products.forEach(product => {
        const productId = product.product?._id.toString() || product.product;
        productCounts[productId] = {
          count: (productCounts[productId]?.count || 0) + product.quantity,
          name: product.name
        };
      });
    });
    
    let mostPopularProduct = { name: '', count: 0 };
    
    Object.values(productCounts).forEach(product => {
      if (product.count > mostPopularProduct.count) {
        mostPopularProduct = product;
      }
    });

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthName = monthStart.toLocaleString('default', { month: 'short' });
      
      const monthlyTransactions = transactions.filter(t => 
        t.createdAt >= monthStart && t.createdAt <= monthEnd
      );
      
      const monthlyTotal = monthlyTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      
      monthlyRevenue.push({
        month: monthName,
        revenue: monthlyTotal
      });
    }

    res.status(200).json({
      totalAmount,
      transactionCount: transactions.length,
      avgOrderValue,
      mostPopularProduct,
      monthlyRevenue
    });
  } catch (err) {
    console.error('Error getting transaction stats:', err);
    res.status(500).json({ error: 'Failed to get transaction statistics' });
  }
};

// Get withdrawal statistics and history
exports.getWithdrawalStats = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    
    // Calculate available balance based on completed transactions minus withdrawals
    const deliveredOrders = await Order.find({
      seller: sellerId,
      status: 'Delivered',
      paymentStatus: 'Completed'
    });
    
    // Calculate total revenue
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate fees
    const platformFee = totalRevenue * 0.05; // 5% platform fee
    const paymentProcessingFee = totalRevenue * 0.02; // 2% payment processing fee
    
    // Get all completed withdrawals
    const completedWithdrawals = await Withdrawal.find({
      seller: sellerId,
      status: 'Completed'
    });
    
    const totalWithdrawn = completedWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    
    // Get pending withdrawals
    const pendingWithdrawals = await Withdrawal.find({
      seller: sellerId,
      status: 'Pending'
    });
    
    const pendingAmount = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    
    // Calculate available balance
    const availableBalance = totalRevenue - (platformFee + paymentProcessingFee) - totalWithdrawn - pendingAmount;
    
    // Get the most recent withdrawal
    const lastWithdrawal = await Withdrawal.findOne({
      seller: sellerId
    }).sort({ createdAt: -1 }).limit(1);
    
    const result = {
      availableBalance: Math.max(0, availableBalance), // Ensure it's not negative
      totalWithdrawn,
      pendingWithdrawals: pendingAmount,
      lastWithdrawal: lastWithdrawal ? {
        amount: lastWithdrawal.amount,
        date: lastWithdrawal.createdAt,
        status: lastWithdrawal.status
      } : null
    };
    
    // If this is called directly from another function, return the data
    if (res.json) {
      res.status(200).json(result);
    } else {
      return result;
    }
  } catch (err) {
    console.error('Error getting withdrawal stats:', err);
    if (res.status) {
      res.status(500).json({ error: 'Failed to get withdrawal statistics' });
    } else {
      throw err;
    }
  }
};

// Request a withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }
    
    // Verify user has enough balance
    // Create a mock response object for getWithdrawalStats
    const mockRes = {
      json: null,
      status: null
    };
    
    const stats = await exports.getWithdrawalStats({ seller: req.seller }, mockRes);
    
    if (amount > stats.availableBalance) {
      return res.status(400).json({ error: 'Withdrawal amount exceeds available balance' });
    }
    
    // Create withdrawal request
    const withdrawal = new Withdrawal({
      seller: sellerId,
      amount,
      paymentMethod,
      status: 'Pending',
      notes: 'Withdrawal request submitted'
    });
    
    await withdrawal.save();
    
    // Send email notification
    const seller = await Seller.findById(sellerId);
    
    // Send email to seller
    const sellerEmailContent = `
      <h1>Withdrawal Request Received</h1>
      <p>Dear ${seller.name},</p>
      <p>We have received your withdrawal request for ₹${amount.toFixed(2)}. Your request is being processed and you will receive the funds in your ${paymentMethod === 'bank_transfer' ? 'bank account' : 'UPI account'} within 2-3 business days.</p>
      <p>Withdrawal ID: ${withdrawal._id}</p>
      <p>Amount: ₹${amount.toFixed(2)}</p>
      <p>Payment Method: ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}</p>
      <p>Status: Pending</p>
      <p>If you did not request this withdrawal, please contact our support team immediately.</p>
      <p>Thank you for using our platform.</p>
    `;
    
    // In a real app, you would use a real email sending service
    console.log('Sending withdrawal confirmation email to seller:', sellerEmailContent);
    
    // Send email to admin
    const adminEmailContent = `
      <h1>New Withdrawal Request</h1>
      <p>A seller has requested a withdrawal:</p>
      <p>Seller: ${seller.name} (${seller.email})</p>
      <p>Withdrawal ID: ${withdrawal._id}</p>
      <p>Amount: ₹${amount.toFixed(2)}</p>
      <p>Payment Method: ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}</p>
      <p>Please review and process this request.</p>
    `;
    
    console.log('Sending withdrawal notification email to admin:', adminEmailContent);
    
    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (err) {
    console.error('Error requesting withdrawal:', err);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
};

// Get withdrawal history
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const withdrawals = await Withdrawal.paginate({ seller: sellerId }, options);
    
    res.status(200).json({
      withdrawals: withdrawals.docs,
      pagination: {
        currentPage: withdrawals.page,
        totalPages: withdrawals.totalPages,
        totalItems: withdrawals.totalDocs
      }
    });
  } catch (err) {
    console.error('Error getting withdrawal history:', err);
    res.status(500).json({ error: 'Failed to get withdrawal history' });
  }
};

// Cancel a pending withdrawal request
exports.cancelWithdrawalRequest = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const withdrawalId = req.params.id;
    
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      seller: sellerId,
      status: 'Pending'
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found or already processed' });
    }
    
    withdrawal.status = 'Cancelled';
    withdrawal.notes = `${withdrawal.notes}\nCancelled by seller on ${new Date().toISOString()}`;
    await withdrawal.save();
    
    res.status(200).json({
      message: 'Withdrawal request cancelled successfully',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt
      }
    });
  } catch (err) {
    console.error('Error cancelling withdrawal:', err);
    res.status(500).json({ error: 'Failed to cancel withdrawal request' });
  }
};
