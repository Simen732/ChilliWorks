const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin, ensureSupport } = require('../middleware/auth');
const AdminController = require('../Controllers/AdminController');
const OrganizationController = require('../Controllers/OrganizationController')
// Admin dashboard - only for admins
router.get('/dashboard', [ensureAuthenticated, ensureAdmin], AdminController.getDashboard);

// User management - only for admins
router.get('/users', [ensureAuthenticated, ensureAdmin], AdminController.getUsers);
router.put('/users/:id/role', [ensureAuthenticated, ensureAdmin], AdminController.updateRole);
router.delete('/users/:id', [ensureAuthenticated, ensureAdmin], AdminController.deleteUser);

// Update ticket status - allow support staff
router.put('/tickets/:id/status', [ensureAuthenticated, ensureSupport], AdminController.updateTicketStatus);

// Add this new route to admin.js
router.put('/tickets/:id/assign-role', [ensureAuthenticated, ensureAdmin], AdminController.assignTicketToRole);

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