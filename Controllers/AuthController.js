const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const authService = require('../services/AuthService');
const activityService = require('../services/ActivityService');

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
    if (password.length < 10) {  // Increase from 6 to 10
      errors.push({ msg: 'Password should be at least 10 characters' });
    }

    // Add complexity check
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(password)) {
      errors.push({ msg: 'Password must include at least one uppercase letter, one lowercase letter, and one number' });
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

          // Hash password with argon2
          newUser.password = await argon2.hash(password, {
            type: argon2.argon2id, // Use argon2id variant (recommended)
            memoryCost: 2**16,     // 64 MiB memory usage
            timeCost: 3,           // 3 iterations
            parallelism: 1         // 1 degree of parallelism
          });
          
          // Save user
          await newUser.save();
          
          await activityService.logActivity(
            'registered a new account',
            'user',
            newUser._id
          );

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

  // Handle login with JWT
  async postLogin(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/auth/login');
      }
      
      // Verify password with argon2
      const isMatch = await argon2.verify(user.password, password);
      
      if (!isMatch) {
        req.flash('error_msg', 'Invalid email or password');
        return res.redirect('/auth/login');
      }
      
      // Create JWT payload
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      
      // Sign token
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || process.env.SESSION_SECRET,
        { expiresIn: '12h' }
      );
      
      // Set secure httpOnly JWT cookie for authentication
      res.cookie('jwt', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', // Secure in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Set a non-httpOnly cookie for Socket.IO auth
      res.cookie('socket_token', token, {
        httpOnly: false, // JavaScript can read this
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
      });
      
      await activityService.logActivity(
        'logged in',
        'user',
        user._id
      );

      // Redirect to dashboard
      res.redirect('/dashboard');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'Error during login');
      res.redirect('/auth/login');
    }
  }

  // Handle logout - clear JWT cookie
  logout(req, res) {
    res.clearCookie('token');
    res.clearCookie('socket_token');
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  }

  // Render forgot password page
  getForgotPassword(req, res) {
    res.render('auth/forgot-password', {
      error: null,
      success: null
    });
  }

  // Handle forgot password submission
  async postForgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        req.flash('error_msg', 'Please enter your email address');
        return res.redirect('/auth/forgot-password');
      }
      
      const result = await authService.forgotPassword(email);
      
      // Always show the same message whether the email exists or not
      // This prevents user enumeration attacks
      req.flash('success_msg', 'If an account exists with that email, a password reset link has been sent. Check the server console for the preview URL.');
      return res.redirect('/auth/login');
    } catch (error) {
      console.error('Forgot password error:', error);
      req.flash('error_msg', 'An error occurred. Please try again later.');
      return res.redirect('/auth/forgot-password');
    }
  }

  // Render reset password page
  async getResetPassword(req, res) {
    try {
      const { token } = req.params;
      
      const validation = await authService.validateResetToken(token);
      
      if (!validation.success) {
        req.flash('error_msg', validation.message);
        return res.redirect('/auth/forgot-password');
      }
      
      res.render('auth/reset-password', { token });
    } catch (error) {
      console.error('Get reset password error:', error);
      req.flash('error_msg', 'An error occurred. Please try again later.');
      res.redirect('/auth/forgot-password');
    }
  }

  // Handle password reset
  async postResetPassword(req, res) {
    try {
      const { password, password2 } = req.body;
      const { token } = req.params;
      let errors = [];
      
      // Validate passwords
      if (!password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
      }
      
      if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
      }
      
      if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
      }
      
      if (errors.length > 0) {
        return res.render('auth/reset-password', {
          errors,
          token
        });
      }
      
      const result = await authService.resetPassword(token, password);
      
      if (result.success) {
        await activityService.logActivity(
          'reset their password',
          'user',
          user._id
        );

        req.flash('success_msg', 'Your password has been updated! You can now login with your new password');
        return res.redirect('/auth/login');
      } else {
        req.flash('error_msg', result.message);
        return res.redirect('/auth/forgot-password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      req.flash('error_msg', 'An error occurred while resetting password');
      res.redirect('/auth/forgot-password');
    }
  }
}

module.exports = new AuthController();