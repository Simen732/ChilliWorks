const Organization = require('../models/Organization');
const User = require('../models/User');
const activityService = require('../services/ActivityService');

// Get all organizations (admin only)
const getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find()
                                    .populate('createdBy', 'name email')
                                    .sort({ createdAt: -1 });
    
    res.render('organizations/index', { organizations }); // Updated path
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching organizations');
    res.redirect('/dashboard');
  }
};

// Create organization form
const getCreateOrganization = (req, res) => {
  res.render('organizations/create'); // Updated path
};

// Create a new organization
const createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const newOrg = new Organization({
      name,
      description,
      createdBy: req.user.id
    });
    
    await newOrg.save();
    
    await activityService.logActivity(
      `created organization "${name}"`,
      'organization', // Changed back to 'organization'
      newOrg._id,
      req.user.id
    );
    
    req.flash('success_msg', 'Organization created successfully');
    res.redirect('/organizations');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating organization');
    res.redirect('/organizations/create');
  }
};

// View organization details
const getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
                                   .populate('createdBy', 'name email');
    
    if (!organization) {
      req.flash('error_msg', 'Organization not found');
      return res.redirect('/organizations');
    }
    
    // Get members of the organization
    const members = await User.find({ organization: organization._id })
                         .select('name email role');
    
    res.render('organizations/view', { // Updated path
      organization,
      members
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching organization details');
    res.redirect('/organizations');
  }
};

// Add member to organization (form)
const getAddMember = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      req.flash('error_msg', 'Organization not found');
      return res.redirect('/organizations');
    }
    
    // Get users who are not part of any organization
    const availableUsers = await User.find({ 
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    }).select('name email');
    
    res.render('organizations/add-member', { // Updated path
      organization,
      availableUsers
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching organization details');
    res.redirect('/organizations');
  }
};

// Add member to organization (submit)
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body; // Changed from userId to email
    const organizationId = req.params.id;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      req.flash('error_msg', 'Organization not found');
      return res.redirect('/organizations');
    }
    
    // Find user by email instead of ID
    const user = await User.findOne({ email: email });
    if (!user) {
      req.flash('error_msg', 'User not found. Please check the email address.');
      return res.redirect(`/organizations/${organizationId}`);
    }
    
    // Check if user is already in an organization
    if (user.organization) {
      req.flash('error_msg', 'User already belongs to an organization');
      return res.redirect(`/organizations/${organizationId}`);
    }
    
    // Update the user's organization and role
    user.organization = organizationId;
    user.role = role; // 'employee' or 'manager'
    await user.save();
    
    await activityService.logActivity(
      `added ${user.name} as ${role} to organization "${organization.name}"`,
      'organization',
      organizationId,
      req.user.id
    );
    
    req.flash('success_msg', `${user.name} added to organization as ${role}`);
    res.redirect(`/organizations/${organizationId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding user to organization');
    res.redirect(`/organizations/${req.params.id}`);
  }
};

// Change member role
const changeMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const organizationId = req.params.id;
    
    if (!['employee', 'manager'].includes(role)) {
      req.flash('error_msg', 'Invalid role');
      return res.redirect(`/organizations/${organizationId}`);
    }
    
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect(`/organizations/${organizationId}`);
    }
    
    // Update the user's role
    user.role = role;
    await user.save();
    
    req.flash('success_msg', `Role updated to ${role}`);
    res.redirect(`/organizations/${organizationId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error changing member role');
    res.redirect(`/organizations/${req.params.id}`);
  }
};

// Remove member from organization
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const organizationId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect(`/organizations/${organizationId}`);
    }
    
    // Remove organization from user and reset role to 'user' if not admin
    user.organization = undefined;
    if (user.role !== 'admin') {
      user.role = 'user';
    }
    await user.save();
    
    req.flash('success_msg', `${user.name} removed from organization`);
    res.redirect(`/organizations/${organizationId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error removing member from organization');
    res.redirect(`/organizations/${req.params.id}`);
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;
    const organizationId = req.params.id;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      req.flash('error_msg', 'Organization not found');
      return res.redirect('/organizations');
    }
    
    // Update fields
    organization.name = name;
    organization.description = description;
    organization.updatedAt = Date.now();
    
    await organization.save();
    
    await activityService.logActivity(
      `updated organization "${name}"`,
      'organization',
      organizationId,
      req.user.id
    );
    
    req.flash('success_msg', 'Organization updated successfully');
    res.redirect(`/organizations/${organizationId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating organization');
    res.redirect(`/organizations/${req.params.id}`);
  }
};

// Regenerate registration code
const regenerateRegistrationCode = async (req, res) => {
  try {
    const organizationId = req.params.id;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      req.flash('error_msg', 'Organization not found');
      return res.redirect('/organizations');
    }
    
    // Generate a new registration code (random 8-character alphanumeric)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let registrationCode = '';
    for (let i = 0; i < 8; i++) {
      registrationCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    organization.registrationCode = registrationCode;
    organization.updatedAt = Date.now();
    await organization.save();
    
    await activityService.logActivity(
      `regenerated registration code for organization "${organization.name}"`,
      'organization',
      organizationId,
      req.user.id
    );
    
    req.flash('success_msg', 'Registration code regenerated successfully');
    res.redirect(`/organizations/${organizationId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error regenerating registration code');
    res.redirect(`/organizations/${req.params.id}`);
  }
};

module.exports = {
  getOrganizations,
  getCreateOrganization,
  createOrganization,
  getOrganization,
  getAddMember,
  addMember, // Update this export to use the renamed function
  changeMemberRole,
  removeMember,
  updateOrganization,
  regenerateRegistrationCode
};