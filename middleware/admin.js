// Ensure user is an admin
const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'You do not have permission to access this resource');
  res.redirect('/dashboard');
};

module.exports = {
  ensureAdmin
};