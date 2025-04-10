const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const User = require('../models/User');
const activityService = require('../services/ActivityService');

// Create ticket page
const getCreateTicket = (req, res) => {
  res.render('tickets/create');
};

// Submit new ticket
const createTicket = async (req, res) => {
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
    
    await activityService.logActivity(
      'created a new ticket',
      'ticket',
      newTicket._id,  // This should be entityId (ticket ID)
      req.user.id     // This should be userId
    );
    
    req.flash('success_msg', 'Ticket created successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating ticket');
    res.redirect('/tickets/create');
  }
};

// View single ticket
const getTicket = async (req, res) => {
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
    // Allow linje 1, linje 2, and admin to view any ticket
    const isSupport = ['linje 1', 'linje 2', 'admin'].includes(req.user.role);
    if (!isSupport && ticket.user._id.toString() !== req.user.id) {
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
      isAdmin: req.user.role === 'admin',
      isSupport: isSupport,
      currentUser: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error viewing ticket');
    res.redirect('/dashboard');
  }
};

// Show edit ticket form
const getEditTicket = async (req, res) => {
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
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    let { status, assignedTo, priority, notes } = req.body;
    
    // Ensure status is not null - default to 'Open' if missing
    if (!status) {
      status = 'Open';
    }
    
    const ticket = await Ticket.findByIdAndUpdate(ticketId, {
      status,
      assignedTo,
      priority,
      notes
    }, { new: true });
    
    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/dashboard');
    }
    
    // Log admin activity with correct parameter order
    let actionDescription = `updated ticket #${ticketId}`;
    if (status) actionDescription += ` - changed status to ${status}`;
    if (assignedTo) actionDescription += ` - assigned to user ${assignedTo}`;
    
    await activityService.logActivity(
      actionDescription,
      'ticket',
      ticketId,
      req.user.id
    );
    
    req.flash('success_msg', 'Ticket updated successfully');
    res.redirect(`/tickets/${ticketId}`);
    
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error updating ticket');
    res.redirect('/dashboard');
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    // Check if ticket exists
    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/dashboard');
    }
    
    // UPDATED: Check if user is an admin
    if (req.user.role !== 'admin') {
      req.flash('error_msg', 'Not authorized - only administrators can delete tickets');
      return res.redirect('/dashboard');
    }
    
    // NEW: Check if the ticket status is 'Closed'
    if (ticket.status !== 'Closed') {
      req.flash('error_msg', 'Only tickets with status "Closed" can be deleted');
      return res.redirect(`/tickets/${req.params.id}`);
    }
    
    // Delete all comments for this ticket
    await Comment.deleteMany({ ticket: ticket._id });
    
    // Delete the ticket
    await Ticket.findByIdAndDelete(req.params.id);
    
    // Log the activity
    await activityService.logActivity(
      `deleted ticket "${ticket.title}"`,
      'ticket',
      null,
      req.user.id
    );
    
    req.flash('success_msg', 'Ticket deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting ticket');
    res.redirect(`/tickets/${req.params.id}`);
  }
};

// Add comment to ticket
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    // Check if ticket exists
    if (!ticket) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/dashboard');
    }
    
    // Check if user has permission to comment on this ticket
    if (!['admin', 'linje 1', 'linje 2'].includes(req.user.role) && ticket.user.toString() !== req.user.id) {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(403).json({ error: 'Not authorized' });
      }
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
    
    await activityService.logActivity(
      'added a comment to ticket ' + ticket.title,
      'comment',
      ticket._id,  // The entity ID should be the ticket ID
      req.user.id  // The user ID
    );
    
    // Update ticket's updatedAt field
    ticket.updatedAt = Date.now();
    await ticket.save();
    
    // Get the populated comment for emitting
    const populatedComment = await Comment.findById(newComment._id)
                                      .populate('user', 'name role');

    // Emit socket event for real-time comment update
    const io = req.app.get('io');
    io.to(`ticket-${ticket._id}`).emit('new-comment', {
      ticketId: ticket._id,
      comment: {
        _id: populatedComment._id,
        text: populatedComment.text,
        user: {
          name: populatedComment.user.name,
          role: populatedComment.user.role
        },
        createdAt: populatedComment.createdAt
      }
    });
    
    // If it's an AJAX request, send JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(200).json({ 
        success: true, 
        message: 'Comment added successfully' 
      });
    }
    
    // For traditional form submission (fallback)
    req.flash('success_msg', 'Comment added');
    res.redirect(`/tickets/${req.params.id}`);
  } catch (err) {
    console.error(err);
    
    // If it's an AJAX request, send JSON error
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ error: 'Error adding comment' });
    }
    
    // For traditional form submission (fallback)
    req.flash('error_msg', 'Error adding comment');
    res.redirect(`/tickets/${req.params.id}`);
  }
};

// Get user tickets (dashboard or "your tickets" page)
const getUserTickets = async (req, res) => {
  try {
    let tickets;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // tickets per page
    const skip = (page - 1) * limit;
    
    // If admin, get all tickets
    // If regular user, only get their tickets
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
    
    // Count total tickets that match the filter
    const total = await Ticket.countDocuments(filter);
    
    // Get tickets with pagination
    tickets = await Ticket.find(filter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.render('tickets/index', {
      tickets,
      current: page,
      pages: Math.ceil(total / limit),
      user: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching tickets');
    res.redirect('/dashboard');
  }
};

module.exports = {
  getCreateTicket,
  createTicket,
  getTicket,
  getEditTicket,
  updateTicket,
  deleteTicket,
  addComment,
  getUserTickets
};