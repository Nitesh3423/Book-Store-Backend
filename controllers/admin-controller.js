const Admin = require("../models/admin-model");
const mongoose = require("mongoose");
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
    const token = jwt.sign({ adminId: admin._id, role: "admin" }, JWT_SECRET, {
      expiresIn: "1d",
    });

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

// View approved sellers
exports.getApprovedSellers = async (req, res) => {
  try {
    const approvedSellers = await Seller.find({ registrationStatus: "approved" });
    res.json(approvedSellers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch approved sellers" });
  }
};

// Approve seller
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const pending = await PendingSeller.findById(sellerId);
    if (!pending) {
      return res.status(404).json({ error: "Pending seller not found" });
    }

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email: pending.email });
    if (existingSeller) {
      return res.status(400).json({ error: "Seller already approved" });
    }

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
    const deleteResult = await PendingSeller.findByIdAndDelete(sellerId);

    if (!deleteResult) {
      console.error(
        "Failed to delete seller from PendingSeller. ID might be invalid or already removed."
      );
    } else {
      console.log("Deleted pending seller:", deleteResult.email);
    }

    res.json({
      message: "Seller approved and registered",
      sellerId: newSeller._id,
    });
  } catch (err) {
    console.error("Error approving seller:", err);
    res.status(500).json({ error: "Approval failed" });
  }
};

// Remove seller
exports.removeSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Check if it's a pending seller
    let seller = await PendingSeller.findById(sellerId);
    if (seller) {
      await PendingSeller.findByIdAndDelete(sellerId);
      return res.json({ message: "Pending seller removed successfully" });
    }
    
    // Check if it's an approved seller
    seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }
    
    await Seller.findByIdAndDelete(sellerId);
    res.json({ message: "Seller removed successfully" });
  } catch (err) {
    console.error("Error removing seller:", err);
    res.status(500).json({ error: "Failed to remove seller" });
  }
};
