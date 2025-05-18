const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const mongoose = require('mongoose');

const sellerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role !== 'seller') {
        return res.status(403).json({ error: 'Access denied: Not a seller' });
      }

      // Set the seller ID for use in controllers
      req.sellerId = decoded.sellerId;
      
      // Try to fetch the seller object if possible
      try {
        const Seller = mongoose.model('Seller');
        const seller = await Seller.findById(decoded.sellerId);
        if (seller) {
          req.seller = seller;
        } else {
          console.warn(`Seller with ID ${decoded.sellerId} not found in database`);
        }
      } catch (fetchError) {
        console.warn('Error fetching seller object:', fetchError);
        // Continue even if we couldn't fetch the seller object
      }
      
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = sellerAuth;
