const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthController {
  // Render login page
  getLogin(req, res) {
    res.render('auth/login');
  }

  // Render register page
  getRegister(req, res) {
    res.render('auth/register');
  }

  // Register new user
  async postRegister(req, res) {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all fields' });
    }

    // Check passwords match
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
      res.render('auth/register', {
        errors,
        name,
        email
      });
    } else {
      try {
        // Check if user exists
        const user = await User.findOne({ email });

        if (user) {
          errors.push({ msg: 'Email is already registered' });
          res.render('auth/register', {
            errors,
            name,
            email
          });
        } else {
          // Create new user
          const newUser = new User({
            name,
            email,
            password
          });

          // Hash password
          const salt = await bcrypt.genSalt(10);
          newUser.password = await bcrypt.hash(password, salt);
          
          // Save user
          await newUser.save();
          
          req.flash('success_msg', 'You are now registered and can log in');
          res.redirect('/auth/login');
        }
      } catch (err) {
        console.error(err);
        req.flash('error_msg', 'An error occurred during registration');
        res.redirect('/auth/register');
      }
    }
  }

  // Handle login
  postLogin(req, res, next) {
    passport.authenticate('local', {
      successRedirect: '/dashboard',
      failureRedirect: '/auth/login',
      failureFlash: true
    })(req, res, next);
  }

  // Handle logout
  logout(req, res) {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  }
}

module.exports = new AuthController();