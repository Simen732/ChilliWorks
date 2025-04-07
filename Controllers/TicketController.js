const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');

class TicketController {
  // Render create ticket page
  getCreateTicket(req, res) {
    res.render('tickets/create');
  }

  // Create new ticket
  async createTicket(req, res) {
    try {
      const { title, description, category, priority } = req.body;
      
      // Create new ticket
      const newTicket = new Ticket({
        title,
        description,
        category,
        priority,
        user: req.user.id
      });
      
      await newTicket.save();
      
      req.flash('success_msg', 'Ticket created successfully');
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error creating ticket');
      res.redirect('/tickets/create');
    }
  }

  // View single ticket
  async getTicket(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id)
                              .populate('user', 'name email')
                              .populate('assignedTo', 'name email');
      
      // Check if ticket exists
      if (!ticket) {
        req.flash('error_msg', 'Ticket not found');
        return res.redirect('/dashboard');
      }
      
      // Check if user has permission to view this ticket
      if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/dashboard');
      }
      
      // Get comments for this ticket
      const comments = await Comment.find({ ticket: ticket._id })
                                 .populate('user', 'name role')
                                 .sort({ createdAt: 1 });
      
      res.render('tickets/view', {
        ticket,
        comments,
        isAdmin: req.user.role === 'admin'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error viewing ticket');
      res.redirect('/dashboard');
    }
  }

  // Show edit ticket form
  async getEditTicket(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id);
      
      // Check if ticket exists
      if (!ticket) {
        req.flash('error_msg', 'Ticket not found');
        return res.redirect('/dashboard');
      }
      
      // Check if user has permission to edit this ticket
      if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/dashboard');
      }
      
      res.render('tickets/edit', { ticket });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading edit form');
      res.redirect('/dashboard');
    }
  }

  // Update ticket
  async updateTicket(req, res) {
    try {
      const { title, description, category, priority } = req.body;
      
      const ticket = await Ticket.findById(req.params.id);
      
      // Check if ticket exists
      if (!ticket) {
        req.flash('error_msg', 'Ticket not found');
        return res.redirect('/dashboard');
      }
      
      // Check if user has permission to edit this ticket
      if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/dashboard');
      }
      
      // Update ticket
      ticket.title = title;
      ticket.description = description;
      ticket.category = category;
      ticket.priority = priority;
      ticket.updatedAt = Date.now();
      
      await ticket.save();
      
      req.flash('success_msg', 'Ticket updated successfully');
      res.redirect(`/tickets/${ticket._id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating ticket');
      res.redirect(`/tickets/${req.params.id}/edit`);
    }
  }

  // Delete ticket
  async deleteTicket(req, res) {
    try {
      const ticket = await Ticket.findById(req.params.id);
      
      // Check if ticket exists
      if (!ticket) {
        req.flash('error_msg', 'Ticket not found');
        return res.redirect('/dashboard');
      }
      
      // Check if user has permission to delete this ticket
      if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/dashboard');
      }
      
      // Delete all comments for this ticket
      await Comment.deleteMany({ ticket: ticket._id });
      
      // Delete the ticket
      await Ticket.findByIdAndDelete(req.params.id);
      
      req.flash('success_msg', 'Ticket deleted successfully');
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error deleting ticket');
      res.redirect(`/tickets/${req.params.id}`);
    }
  }

  // Add comment to ticket
  async addComment(req, res) {
    try {
      const { text } = req.body;
      const ticket = await Ticket.findById(req.params.id);
      
      // Check if ticket exists
      if (!ticket) {
        req.flash('error_msg', 'Ticket not found');
        return res.redirect('/dashboard');
      }
      
      // Check if user has permission to comment on this ticket
      if (req.user.role !== 'admin' && ticket.user.toString() !== req.user.id) {
        req.flash('error_msg', 'Not authorized');
        return res.redirect('/dashboard');
      }
      
      // Create new comment
      const newComment = new Comment({
        text,
        ticket: ticket._id,
        user: req.user.id
      });
      
      await newComment.save();
      
      // Update ticket's updatedAt field
      ticket.updatedAt = Date.now();
      await ticket.save();
      
      req.flash('success_msg', 'Comment added');
      res.redirect(`/tickets/${req.params.id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error adding comment');
      res.redirect(`/tickets/${req.params.id}`);
    }
  }
}

module.exports = new TicketController();