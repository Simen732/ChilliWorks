const { body, validationResult } = require('express-validator');

const ticketValidation = [
  body('title').trim().isLength({ min: 5, max: 100 }).escape(),
  body('description').trim().isLength({ min: 10 }).escape(),
  body('category').isIn(['Hardware', 'Software', 'Network', 'Other']),
  body('priority').isIn(['Low', 'Medium', 'High', 'Urgent'])
];

const userValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  ticketValidation,
  userValidation,
  handleValidationErrors
};