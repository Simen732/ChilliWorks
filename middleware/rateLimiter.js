const rateLimit = require('express-rate-limit');

// Increase the limits on the standard limiter
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Increased from 100 to 300
  standardHeaders: true,
  message: 'Too many requests, please try again later.',
  skip: (req, res) => req.ip === '127.0.0.1', // Skip for localhost
});

// Keep auth limiter stricter for security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  keyGenerator: (req) => {
    if (req.body.email) {
      return req.ip + '-' + req.body.email;
    }
    return req.ip;
  },
  message: 'Too many login attempts, please try again after 15 minutes.',
});

// Make ticket limiter more lenient
const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased from 30 to 50
  standardHeaders: true,
  message: 'Too many ticket operations, please try again later.',
});

module.exports = {
  standardLimiter,
  authLimiter,
  ticketLimiter
};