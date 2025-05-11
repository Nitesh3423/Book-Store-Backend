const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authentication middleware that checks for a JWT token in the Authorization header
 * using the Bearer scheme. If the token is valid, attaches the decoded user to req.user
 * and calls next(). If the token is missing or invalid, returns a 401 or 400 error.
 */
const authenticateUser = async (req, res, next) => {
  // Check if Authorization header exists and has correct format
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      error: "Unauthorized: No token provided or invalid format" 
    });
  }
  
  // Extract token from header
  const token = authHeader.split(" ")[1];
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the decoded user to the request object
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    
    // Return appropriate error based on the error type
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false,
        error: "Unauthorized: Token has expired" 
      });
    }
    
    return res.status(400).json({ 
      success: false,
      error: "Bad Request: Invalid token" 
    });
  }
};

module.exports = { authenticateUser }; 