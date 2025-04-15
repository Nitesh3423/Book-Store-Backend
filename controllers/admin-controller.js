const Admin = require("../models/admin-model");
const PendingSeller = require("../models/pending-seller-model");
const Seller = require("../models/seller-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
// Register new admin 
exports.registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Admin registration failed" });
  }
};

// Admin login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("Is match?", isMatch);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    // Generate JWT
    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// View pending sellers
exports.getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await PendingSeller.find();
    res.json(pendingSellers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending sellers" });
  }
};

// Approve seller
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const pending = await PendingSeller.findById(sellerId);
    if (!pending)
      return res.status(404).json({ error: "Pending seller not found" });

    const newSeller = new Seller({
      fullName: pending.fullName,
      email: pending.email,
      password: pending.password,
      googleId: pending.googleId,
      bankDetails: pending.bankDetails,
      panCard: pending.panCard,
      aadhaarCard: pending.aadhaarCard,
      registrationStatus: "approved",
    });

    await newSeller.save();
    await PendingSeller.findByIdAndDelete(sellerId);

    res.json({
      message: "Seller approved and registered",
      sellerId: newSeller._id,
    });
  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
  }
};
