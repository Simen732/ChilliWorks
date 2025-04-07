const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const TicketController = require('../controllers/TicketController');

// Create ticket page
router.get('/create', ensureAuthenticated, TicketController.getCreateTicket);

// Submit new ticket
router.post('/', ensureAuthenticated, TicketController.createTicket);

// View single ticket
router.get('/:id', ensureAuthenticated, TicketController.getTicket);

// Edit ticket form
router.get('/:id/edit', ensureAuthenticated, TicketController.getEditTicket);

// Update ticket
router.put('/:id', ensureAuthenticated, TicketController.updateTicket);

// Delete ticket
router.delete('/:id', ensureAuthenticated, TicketController.deleteTicket);

// Add comment to ticket
router.post('/:id/comments', ensureAuthenticated, TicketController.addComment);

module.exports = router;
