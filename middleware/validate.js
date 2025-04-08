const { body, validationResult } = require('express-validator');

const ticketValidation = [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('category').isIn(['Hardware', 'Software', 'Network', 'Other']).withMessage('Please select a valid category'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Please select a valid priority')
];

const userValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // For API requests, continue returning JSON
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(422).json({ errors: errors.array() });
    }
    
    // For regular form submissions, flash errors and redirect back
    const errorMessages = errors.array();
    req.flash('error_msg', errorMessages[0].msg);
    
    // If creating a ticket, redirect back to the create form
    if (req.originalUrl === '/tickets') {
      return res.redirect('/tickets/create');
    }
    
    // Default redirect to dashboard
    return res.redirect('/dashboard');
  }
  next();
};

module.exports = {
  ticketValidation,
  userValidation,
  handleValidationErrors
};