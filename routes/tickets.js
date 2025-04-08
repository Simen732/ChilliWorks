const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const TicketController = require('../controllers/TicketController');
const { ticketLimiter } = require('../middleware/rateLimiter');

// Create ticket page
router.get('/create', ensureAuthenticated, TicketController.getCreateTicket);

// Submit new ticket - add rate limiter
router.post('/', ensureAuthenticated, ticketLimiter, TicketController.createTicket);

// View single ticket
router.get('/:id', ensureAuthenticated, TicketController.getTicket);

// Edit ticket form
router.get('/:id/edit', ensureAuthenticated, TicketController.getEditTicket);

// Update ticket - add rate limiter
router.put('/:id', ensureAuthenticated, ticketLimiter, TicketController.updateTicket);

// Delete ticket
router.delete('/:id', ensureAuthenticated, TicketController.deleteTicket);

// Add comment to ticket
router.post('/:id/comments', ensureAuthenticated, TicketController.addComment);

module.exports = router;