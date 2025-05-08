const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin-model');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore');
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if default admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Default admin already exists');
    } else {
      // Create a new admin with default credentials
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = new Admin({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword
      });
      
      await newAdmin.save();
      console.log('Default admin created successfully!');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

// Run the seed function
seedAdmin(); 