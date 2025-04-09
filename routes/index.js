const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const IndexController = require('../Controllers/IndexController');

// Home page
router.get('/', IndexController.getHomePage);

// Dashboard
router.get('/dashboard', ensureAuthenticated, IndexController.getDashboard);

// User Manual
router.get('/manual', ensureAuthenticated, IndexController.getUserManual);

module.exports = router;