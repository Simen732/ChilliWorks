const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const Organization = require('../models/Organization');
const Activity = require('../models/Activity');
const activityService = require('../services/ActivityService');

// Admin dashboard
const getDashboard = async (req, res) => {
  try {
    // Get counts for dashboard stats
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    const userCount = await User.countDocuments({ role: 'user' });
    
    // Add counts for tickets assigned to specific roles
    const linje1Tickets = await Ticket.countDocuments({ assignedRole: 'linje 1' });
    const linje2Tickets = await Ticket.countDocuments({ assignedRole: 'linje 2' });
    
    // Get recent activities
    const recentActivities = await activityService.getRecentActivities(10);
    
    res.render('admin/dashboard', {
      openTickets,
      inProgressTickets,
      resolvedTickets,
      userCount,
      linje1Tickets,
      linje2Tickets,
      recentActivities
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading admin dashboard');
    res.redirect('/dashboard');
  }
};

// User management page
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { 
      users,
      currentUser: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching users');
    res.redirect('/admin/dashboard');
  }
};

// Update user role
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    // Don't allow changing your own role
    if (userId === req.user.id) {
      req.flash('error_msg', 'You cannot change your own role');
      return res.redirect('/admin/users');
    }
    
    // Validate the role is one of the allowed values
    if (!['user', 'linje 1', 'linje 2', 'admin'].includes(role)) {
      req.flash('error_msg', 'Invalid role specified');
      return res.redirect('/admin/users');
    }
    
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    // Log activity for the role change
    await activityService.logActivity(
      `changed ${user.name}'s role to ${role}`,
      'user',
      user._id,
      req.user.id
    );
    
    req.flash('success_msg', `${user.name}'s role has been updated to ${role}`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating user role');
    res.redirect('/admin/users');
  }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Allow linje 1, linje 2, and admin to update ticket status
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now(),
        ...(status === 'In Progress' && { assignedTo: req.user.id })
      },
      { new: true }
    ).populate('user', 'name email')
     .populate('assignedTo', 'name email');
    
    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/dashboard');
    }
    
    // Log activity
    await activityService.logActivity(
      `updated ticket status to ${status}`,
      'ticket',
      ticket._id,
      req.user.id
    );
    
    // Emit socket event for real-time status update
    const io = req.app.get('io');
    io.to(`ticket-${ticket._id}`).emit('status-update', {
      ticketId: ticket._id,
      status: ticket.status,
      updatedBy: req.user.name,
      timestamp: new Date()
    });
    
    req.flash('success_msg', `Ticket status updated to ${status}`);
    res.redirect(`/tickets/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating ticket status');
    res.redirect(`/tickets/${req.params.id}`);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.user.id) {
      req.flash('error_msg', 'You cannot delete your own account');
      return res.redirect('/admin/users');
    }
    
    // Find the user to be deleted
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    
    const userName = user.name; // Store name for the success message
    
    // Delete user's tickets
    await Ticket.deleteMany({ user: user._id });
    
    // Delete user's comments
    await Comment.deleteMany({ user: user._id });
    
    // Remove user from any organizations they might be in
    if (user.organization) {
      // If user is the only one in their organization, delete the organization
      const orgMemberCount = await User.countDocuments({ organization: user.organization });
      if (orgMemberCount <= 1) {
        await Organization.findByIdAndDelete(user.organization);
      }
    }
    
    // Delete user activities
    await Activity.deleteMany({ user: user._id });
    
    // Finally delete the user
    await User.findByIdAndDelete(req.params.id);
    
    // Log the activity
    await activityService.logActivity(
      `deleted user "${userName}"`,
      'user',
      null,
      req.user.id
    );
    
    req.flash('success_msg', `User ${userName} has been deleted`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting user');
    res.redirect('/admin/users');
  }
};

// Assign ticket to role
const assignTicketToRole = async (req, res) => {
  try {
    const { role } = req.body;
    const ticketId = req.params.id;
    
    // Validate role is either linje 1, linje 2, or null (to clear role assignment)
    if (role !== 'linje 1' && role !== 'linje 2' && role !== '') {
      req.flash('error_msg', 'Invalid role specified');
      return res.redirect(`/tickets/${ticketId}`);
    }
    
    // If role is empty string, set to null (clear assignment)
    const assignedRole = role === '' ? null : role;
    
    // Update ticket with role assignment and set status to In Progress if not already resolved/closed
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/dashboard');
    }
    
    // Remove individual assignment if assigning to role
    if (assignedRole) {
      ticket.assignedTo = null;
    }
    
    ticket.assignedRole = assignedRole;
    
    // Update status to In Progress if it's currently Open
    if (ticket.status === 'Open' && assignedRole) {
      ticket.status = 'In Progress';
    }
    
    ticket.updatedAt = Date.now();
    await ticket.save();
    
    // Log activity
    const actionDescription = assignedRole 
      ? `assigned ticket to ${assignedRole} team` 
      : 'removed role assignment from ticket';
    
    await activityService.logActivity(
      actionDescription,
      'ticket',
      ticketId,
      req.user.id
    );
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.to(`ticket-${ticket._id}`).emit('ticket-update', {
      ticketId: ticket._id,
      status: ticket.status,
      assignedRole: ticket.assignedRole,
      updatedBy: req.user.name,
      timestamp: new Date()
    });
    
    req.flash('success_msg', assignedRole 
      ? `Ticket assigned to ${assignedRole} team` 
      : 'Role assignment removed');
    
    res.redirect(`/tickets/${ticketId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error assigning ticket to role');
    res.redirect(`/tickets/${req.params.id}`);
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateRole,
  updateTicketStatus,
  deleteUser,
  assignTicketToRole
};