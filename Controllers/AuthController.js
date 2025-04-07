const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
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

          // Hash password with argon2
          newUser.password = await argon2.hash(password, {
            type: argon2.argon2id, // Use argon2id variant (recommended)
            memoryCost: 2**16,     // 64 MiB memory usage
            timeCost: 3,           // 3 iterations
            parallelism: 1         // 1 degree of parallelism
          });
          
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
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
      });

      // Set a non-httpOnly cookie for Socket.IO auth
      res.cookie('socket_token', token, {
        httpOnly: false, // JavaScript can read this
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
      });
      
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
}

module.exports = new AuthController();