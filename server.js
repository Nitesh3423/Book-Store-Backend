const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./utils/db');
const sellerRoutes = require('./routes/seller-route');
const adminRoutes = require('./routes/admin-route');
const userRoutes = require('./routes/user-route');
const productRoutes =require('./routes/product-routes')

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Connect DB
connectDB();

// Routes
app.use("/api", productRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
