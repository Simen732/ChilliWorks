const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');

// Login page
router.get('/login', ensureGuest, AuthController.getLogin);

// Register page
router.get('/register', ensureGuest, AuthController.getRegister);

// Register handle
router.post('/register', AuthController.postRegister);

// Login handle
router.post('/login', AuthController.postLogin);

// Logout
router.get('/logout', AuthController.logout);

module.exports = router;