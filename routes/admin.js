const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/AdminController');
const OrganizationController = require('../controllers/OrganizationController')
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

// Organization routes
router.get('/organizations', [ensureAuthenticated, ensureAdmin], OrganizationController.getOrganizations);
router.get('/organizations/create', [ensureAuthenticated, ensureAdmin], OrganizationController.getCreateOrganization);
router.post('/organizations', [ensureAuthenticated, ensureAdmin], OrganizationController.createOrganization);
router.get('/organizations/:id', [ensureAuthenticated, ensureAdmin], OrganizationController.getOrganization);
router.get('/organizations/:id/members/add', [ensureAuthenticated, ensureAdmin], OrganizationController.getAddMember);
router.post('/organizations/:id/members', [ensureAuthenticated, ensureAdmin], OrganizationController.addMember);
router.delete('/organizations/:id/members/:userId', [ensureAuthenticated, ensureAdmin], OrganizationController.removeMember);
router.put('/organizations/:id/members/:userId/role', [ensureAuthenticated, ensureAdmin], OrganizationController.changeMemberRole);

module.exports = router;