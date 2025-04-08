const express = require('express');
const router = express.Router();
const OrganizationController = require('../Controllers/OrganizationController');
const { ensureAuthenticated } = require('../middleware/auth');

// Fix method name to match what's in the controller
router.get('/', ensureAuthenticated, OrganizationController.getOrganizations);

// Create organization form
router.get('/create', ensureAuthenticated, OrganizationController.getCreateOrganization);

// Create organization
router.post('/', ensureAuthenticated, OrganizationController.createOrganization);

// View organization
router.get('/:id', ensureAuthenticated, OrganizationController.getOrganization);

// Update organization
router.put('/:id', ensureAuthenticated, OrganizationController.updateOrganization);

// Add user to organization - Fix name to match the controller implementation
router.post('/:id/users', ensureAuthenticated, OrganizationController.addMember);

// Regenerate registration code
router.post('/:id/regenerate-code', ensureAuthenticated, OrganizationController.regenerateRegistrationCode);

module.exports = router;