const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');
const { authLimiter, loginAttemptsLimiter } = require('../middleware/rateLimiter');

// Login page
router.get('/login', ensureGuest, AuthController.getLogin);

// Register page
router.get('/register', ensureGuest, AuthController.getRegister);

// Register handle - add rate limiter
router.post('/register', authLimiter, AuthController.postRegister);

// Login handle - add both limiters
router.post('/login', [authLimiter, loginAttemptsLimiter], AuthController.postLogin);

// Logout
router.get('/logout', AuthController.logout);

// Forgot password page
router.get('/forgot-password', AuthController.getForgotPassword);

// Handle forgot password submission - add rate limiter
router.post('/forgot-password', authLimiter, AuthController.postForgotPassword);

// Reset password page (with token)
router.get('/reset-password/:token', AuthController.getResetPassword);

// Handle password reset
router.post('/reset-password/:token', AuthController.postResetPassword);

module.exports = router;