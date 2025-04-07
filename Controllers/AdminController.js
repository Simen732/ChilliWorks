const User = require('../models/User');
const Ticket = require('../models/Ticket');

class AdminController {
  // Admin dashboard
  async getDashboard(req, res) {
    try {
      // Get counts for dashboard stats
      const openTickets = await Ticket.countDocuments({ status: 'Open' });
      const inProgressTickets = await Ticket.countDocuments({ status: 'In Progress' });
      const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
      const userCount = await User.countDocuments({ role: 'user' });
      
      res.render('admin/dashboard', {
        openTickets,
        inProgressTickets,
        resolvedTickets,
        userCount
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error loading admin dashboard');
      res.redirect('/dashboard');
    }
  }

  // User management page
  async getUsers(req, res) {
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
  }

  // Promote user to admin
  async promoteUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true });
      
      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/admin/users');
      }
      
      req.flash('success_msg', `${user.name} has been promoted to admin`);
      res.redirect('/admin/users');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error promoting user');
      res.redirect('/admin/users');
    }
  }

  // Demote admin to user
  async demoteUser(req, res) {
    try {
      // Don't allow demoting yourself
      if (req.params.id === req.user.id) {
        req.flash('error_msg', 'You cannot demote yourself');
        return res.redirect('/admin/users');
      }
      
      const user = await User.findByIdAndUpdate(req.params.id, { role: 'user' }, { new: true });
      
      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/admin/users');
      }
      
      req.flash('success_msg', `${user.name} has been demoted to user`);
      res.redirect('/admin/users');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error demoting user');
      res.redirect('/admin/users');
    }
  }

  // Update ticket status
  async updateTicketStatus(req, res) {
    try {
      const { status } = req.body;
      
      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        { 
          status,
          updatedAt: Date.now(),
          ...(status === 'In Progress' && { assignedTo: req.user.id })
        },
        { new: true }
      );
      
      if (!ticket) {
        req.flash('error_msg', 'Ticket not found');
        return res.redirect('/dashboard');
      }
      
      req.flash('success_msg', `Ticket status updated to ${status}`);
      res.redirect(`/tickets/${req.params.id}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error updating ticket status');
      res.redirect(`/tickets/${req.params.id}`);
    }
  }
}

module.exports = new AdminController();