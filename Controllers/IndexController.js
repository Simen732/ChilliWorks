const Ticket = require('../models/Ticket');
const Organization = require('../models/Organization');
const User = require('../models/User');

// Home page
const getHomePage = (req, res) => {
  res.render('index');
};

// Dashboard
const getDashboard = async (req, res) => {
  try {
    let tickets;
    let userOrg = null;
    
    if (req.user.organization) {
      userOrg = await Organization.findById(req.user.organization);
    }

    switch(req.user.role) {
      case 'admin':
      case 'linje 1':
      case 'linje 2':
        // Admin and support staff see all tickets
        tickets = await Ticket.find()
                          .populate('user', 'name email')
                          .populate('assignedTo', 'name email')
                          .populate('organization', 'name')
                          .sort({ createdAt: -1 });
        break;
        
      case 'manager':
        // Managers see all tickets in their organization
        tickets = await Ticket.find({ organization: req.user.organization })
                          .populate('user', 'name email')
                          .populate('assignedTo', 'name email')
                          .sort({ createdAt: -1 });
        break;
        
      case 'employee':
        // Employees see tickets assigned to them and tickets they created
        tickets = await Ticket.find({
                         $or: [
                           { assignedTo: req.user.id },
                           { user: req.user.id }
                         ]
                       })
                       .populate('user', 'name email')
                       .populate('assignedTo', 'name email')
                       .sort({ createdAt: -1 });
        break;
        
      default:
        // Default case for other roles
        tickets = await Ticket.find({ user: req.user.id })
                          .sort({ createdAt: -1 });
        break;
    }

    res.render('dashboard', {
      tickets,
      isAdmin: req.user.role === 'admin',
      isSupport: ['linje 1', 'linje 2', 'admin'].includes(req.user.role),
      userOrg
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching tickets');
    res.redirect('/');
  }
};

module.exports = {
  getHomePage,
  getDashboard
};