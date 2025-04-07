const jwt = require('jsonwebtoken');

// Verify JWT token and set req.user
const verifyToken = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies.token;
  
  if (!token) {
    return next();
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SESSION_SECRET);
    
    // Set user data in request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.clearCookie('token');
    next();
  }
};

// Ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/auth/login');
};

// Ensure user is a guest (not logged in)
const ensureGuest = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  res.redirect('/dashboard');
};

module.exports = {
  verifyToken,
  ensureAuthenticated,
  ensureGuest
};