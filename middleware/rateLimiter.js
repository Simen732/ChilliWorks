const rateLimit = require('express-rate-limit');

// Basic limiter for general use
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  message: 'Too many requests, please try again later.',
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  // The key generator uses both IP and email/username to prevent targeting specific accounts
  // while allowing multiple students on the same IP
  keyGenerator: (req) => {
    // For login endpoint
    if (req.body.email) {
      return req.ip + '-' + req.body.email;
    }
    // Default to IP if no email
    return req.ip;
  },
  message: 'Too many login attempts, please try again after 15 minutes.',
});

// Moderate limiter for ticket operations
const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 ticket operations per hour per IP
  standardHeaders: true,
  message: 'Too many ticket operations, please try again later.',
});

// Add a new limiter specifically for failed login attempts
const loginAttemptsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per IP+username combination
  standardHeaders: true,
  keyGenerator: (req) => {
    return req.ip + '-' + (req.body.email || '');
  },
  handler: (req, res) => {
    res.status(429).render('auth/login', {
      error_msg: 'Too many failed login attempts. Account temporarily locked for 15 minutes.'
    });
  }
});

module.exports = {
  standardLimiter,
  authLimiter,
  ticketLimiter,
  loginAttemptsLimiter
};