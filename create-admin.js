require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/admin-model');
const connectDB = require('./utils/db');

// Admin details
const admin = {
  fullName: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123' // This will be hashed
};

// Connect to DB
connectDB()
  .then(async () => {
    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email: admin.email });
      
      if (existingAdmin) {
        console.log('Admin already exists with email:', admin.email);
      } else {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(admin.password, salt);
        
        // Create new admin
        const newAdmin = new Admin({
          fullName: admin.fullName,
          email: admin.email,
          password: hashedPassword
        });
        
        await newAdmin.save();
        console.log('Admin created successfully!');
        console.log('Email:', admin.email);
        console.log('Password:', admin.password);
      }
      
      // Close the connection
      mongoose.connection.close();
    } catch (error) {
      console.error('Error creating admin:', error);
      mongoose.connection.close();
    }
  })
  .catch(err => {
    console.error('Failed to connect to the database:', err);
  }); 