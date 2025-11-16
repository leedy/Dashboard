const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Optional user authentication middleware
 * If a valid token is provided, adds req.user
 * If no token or invalid token, continues without setting req.user
 */
const optionalUserAuth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - that's okay, continue without auth
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Try to verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Only set user if it's a valid user token (not admin)
      if (decoded.userId && !decoded.isAdmin) {
        req.user = decoded;
      }
    } catch (error) {
      // Token invalid or expired - continue without auth
      // We don't return an error, just continue
    }

    next();
  } catch (error) {
    // Any other error - continue without auth
    next();
  }
};

module.exports = optionalUserAuth;
