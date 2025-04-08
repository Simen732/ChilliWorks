// Role-based middleware functions

// Make sure user is a manager
const ensureManager = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
    return next();
  }
  
  req.flash('error_msg', 'You must be a manager to access this resource');
  res.redirect('/dashboard');
};

// Make sure user is at least an employee
const ensureEmployee = (req, res, next) => {
  if (req.user && ['employee', 'manager', 'admin'].includes(req.user.role)) {
    return next();
  }
  
  req.flash('error_msg', 'You must be an employee to access this resource');
  res.redirect('/dashboard');
};

// Make sure user belongs to organization
const ensureOrganizationMember = (req, res, next) => {
  if (req.user && req.user.organization) {
    return next();
  }
  
  req.flash('error_msg', 'You must belong to an organization to access this resource');
  res.redirect('/dashboard');
};

module.exports = {
  ensureManager,
  ensureEmployee,
  ensureOrganizationMember
};