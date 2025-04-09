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
        // Admin sees all tickets
        tickets = await Ticket.find()
                          .populate('user', 'name email')
                          .populate('assignedTo', 'name email')
                          .populate('organization', 'name')
                          .sort({ createdAt: -1 });
        break;
        
      case 'linje 1':
        // Linje 1 sees tickets they created or that are assigned to linje 1 role
        tickets = await Ticket.find({
                         $or: [
                           { user: req.user.id },
                           { assignedRole: 'linje 1' }
                         ]
                       })
                       .populate('user', 'name email')
                       .populate('assignedTo', 'name email')
                       .sort({ createdAt: -1 });
        break;
        
      case 'linje 2':
        // Linje 2 sees tickets they created or that are assigned to linje 2 role
        tickets = await Ticket.find({
                         $or: [
                           { user: req.user.id },
                           { assignedRole: 'linje 2' }
                         ]
                       })
                       .populate('user', 'name email')
                       .populate('assignedTo', 'name email')
                       .sort({ createdAt: -1 });
        break;
        
      case 'manager':
        // Managers see all tickets in their organization
        tickets = await Ticket.find({ organization: req.user.organization })
                          .populate('user', 'name email')
                          .populate('assignedTo', 'name email')
                          .sort({ createdAt: -1 });
        break;
        
      default:
        // Default case for other roles - they only see their own tickets
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

// Add this function to the existing controller
const getUserManual = (req, res) => {
  // Render different manual content based on user role
  const userRole = req.user.role;
  res.render('manual', { 
    userRole, 
    isAdmin: userRole === 'admin',
    isSupport: ['linje 1', 'linje 2'].includes(userRole)
  });
};

module.exports = {
  getHomePage,
  getDashboard,
  getUserManual
};