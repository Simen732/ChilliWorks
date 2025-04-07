const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const IndexController = require('../controllers/IndexController');

// Home page
router.get('/', IndexController.getHomePage);

// Dashboard
router.get('/dashboard', ensureAuthenticated, IndexController.getDashboard);

module.exports = router;
