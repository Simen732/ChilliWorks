const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and set req.user
const verifyToken = async (req, res, next) => {
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

    // Add organization check and populate
    if (req.user) {
      try {
        const user = await User.findById(req.user.id).populate('organization');
        req.user.organizationData = user.organization;
      } catch (err) {
        console.error('Error populating organization data:', err);
      }
    }

    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.clearCookie('token');
    next();
  }
};

// Ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
};

// Ensure user is a guest (not logged in)
const ensureGuest = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  res.redirect('/dashboard');
};

// Ensure user is an admin
const ensureAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/dashboard');
  }
  next();
};

// Ensure user is a manager
const ensureManager = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/dashboard');
  }
  next();
};

// Ensure user belongs to the same organization
const ensureSameOrganization = (req, res, next) => {
  // Allow admins to access any organization
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Check if user belongs to the organization
  const targetOrgId = req.params.orgId || req.body.organizationId;
  
  if (!req.user.organization || req.user.organization.toString() !== targetOrgId) {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/dashboard');
  }
  
  next();
};

// Ensure user is support staff (linje 1, linje 2 or admin)
const ensureSupport = (req, res, next) => {
  if (!req.user || !['linje 1', 'linje 2', 'admin'].includes(req.user.role)) {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/dashboard');
  }
  next();
};

// Ensure user is advanced support (linje 2 or admin)
const ensureAdvancedSupport = (req, res, next) => {
  if (!req.user || !['linje 2', 'admin'].includes(req.user.role)) {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = {
  verifyToken,
  ensureAuthenticated,
  ensureGuest,
  ensureAdmin,
  ensureManager,
  ensureSameOrganization,
  ensureSupport,
  ensureAdvancedSupport
};