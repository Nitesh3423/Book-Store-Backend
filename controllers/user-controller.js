const User = require("../models/user-model"); 
const Order = require("../models/order-model")
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    // First-time login
    if (!user) {
      user = new User({
        fullName: name,
        email,
        googleId,
      });
      await user.save();
    }

    // Issue JWT
    const authToken = jwt.sign({ userId: user._id, role: "user" }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ success: true, message: "Login successful", token: authToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, error: "Google login failed" });
  }
};

// Register
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, googleId, phone, avatar, address, pincode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: "User already exists" });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      googleId,
      phone,
      avatar,
      address,
      pincode,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Registration failed" });
  }
};

// Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password, googleId } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (googleId && user.googleId !== googleId)
      return res.status(400).json({ success: false, error: "Google login failed" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!googleId && !isMatch)
      return res.status(401).json({ success: false, error: "Invalid password" });

    const token = jwt.sign({ userId: user._id, role: "user" }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Login failed" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "fullName email profile phone avatar address pincode"
    );
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, error: "Could not fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { address, phone, avatar } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        "profile.address": address,
        "profile.phone": phone,
        "profile.avatar": avatar,
      },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch {
    res.status(500).json({ success: false, error: "Profile update failed" });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ success: false, error: "Product ID and quantity are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const existingItem = user.cart.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    res.json({ success: true, message: "Cart updated" });
  } catch (err) {
    console.error("Error in addToCart:", err);  
    res.status(500).json({ success: false, error: "Could not update cart" });
  }
};

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    res.json({ success: true, cart: user.cart });
  } catch {
    res.status(500).json({ success: false, error: "Could not fetch cart" });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");

    const totalAmount = user.cart.reduce((sum, item) => {
      return sum + item.quantity * item.product.price;
    }, 0);

    const order = new Order({
      user: user._id,
      products: user.cart,
      totalAmount,
    });

    await order.save();

    // Save order reference to user
    user.orders.push(order._id);
    user.cart = [];
    await user.save();

    res.json({ success: true, message: "Order placed", orderId: order._id, totalAmount });
  } catch (err) {
    console.error("Error placing order:", err.message);
    res.status(500).json({ success: false, error: "Could not place order" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'orders',
      populate: {
        path: 'products.product',  
        select: 'name price images' 
      }
    });

    res.json({ success: true, orders: user.orders }); 
  } catch (err) {
    console.error("Error fetching orders:", err.message);
    res.status(500).json({ success: false, error: "Could not fetch orders" });
  }
};
