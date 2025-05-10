const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./utils/db');
const sellerRoutes = require('./routes/seller-route');
const adminRoutes = require('./routes/admin-route');
const userRoutes = require('./routes/user-route');
const productRoutes = require('./routes/product-routes');

// Preload all models
require('./models/user-model');
require('./models/seller-model');
require('./models/product-model');
require('./models/order-model');
require('./models/customer-model');
require('./models/pending-seller-model');
require('./models/admin-model');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Routes
app.use("/api/sellers", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
