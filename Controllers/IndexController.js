const Ticket = require('../models/Ticket');

class IndexController {
  // Home page
  getHomePage(req, res) {
    // Check if user is already authenticated
    const isAuthenticated = req.isAuthenticated?.() || req.user != null;
    
    res.render('index', {
      isAuthenticated: isAuthenticated,
      user: req.user || null
    });
  }

  // Dashboard
  async getDashboard(req, res) {
    try {
      if (req.user.role === 'admin') {
        // Admin dashboard shows all tickets
        const tickets = await Ticket.find()
                                .populate('user', 'name email')
                                .populate('assignedTo', 'name email')
                                .sort({ createdAt: -1 });
        res.render('dashboard', {
          tickets,
          isAdmin: true
        });
      } else {
        // User dashboard shows only their tickets
        const tickets = await Ticket.find({ user: req.user.id })
                                .sort({ createdAt: -1 });
        res.render('dashboard', {
          tickets,
          isAdmin: false
        });
      }
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error fetching tickets');
      res.redirect('/');
    }
  }
}

module.exports = new IndexController();