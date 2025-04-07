const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/admin');
const AdminController = require('../controllers/AdminController');

// Admin dashboard
router.get('/dashboard', [ensureAuthenticated, ensureAdmin], AdminController.getDashboard);

// User management page
router.get('/users', [ensureAuthenticated, ensureAdmin], AdminController.getUsers);

// Promote user to admin
router.put('/users/:id/promote', [ensureAuthenticated, ensureAdmin], AdminController.promoteUser);

// Demote admin to user
router.put('/users/:id/demote', [ensureAuthenticated, ensureAdmin], AdminController.demoteUser);

// Update ticket status
router.put('/tickets/:id/status', [ensureAuthenticated, ensureAdmin], AdminController.updateTicketStatus);

module.exports = router;
