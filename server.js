const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const connectDB = require('./utils/db');
const sellerRoutes = require('./routes/seller-route');
const adminRoutes = require('./routes/admin-route');

const app = express();
app.use(bodyParser.json());

// Connect DB
connectDB();

// Routes
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
