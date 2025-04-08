const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const argon2 = require('argon2');

class AuthService {
  /**
   * Generate reset token and send password reset email
   */
  async forgotPassword(email) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      
      // If no user found, still return success (security best practice)
      if (!user) {
        return { success: true };
      }
      
      // Generate random token
      const buffer = crypto.randomBytes(32);
      const token = buffer.toString('hex');
      
      // Set token and expiration
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      
      await user.save();
      
      // Send email with reset token
      await this.sendPasswordResetEmail(user.email, token);
      
      return { success: true };
    } catch (error) {
      console.error('Forgot password service error:', error);
      return { success: false, message: 'Error processing request' };
    }
  }
  
  /**
   * Validate reset token
   */
  async validateResetToken(token) {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return { success: false, message: 'Password reset token is invalid or has expired' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Validate reset token error:', error);
      return { success: false, message: 'Error validating token' };
    }
  }
  
  /**
   * Reset the user's password
   */
  async resetPassword(token, password) {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return { success: false, message: 'Password reset token is invalid or has expired' };
      }
      
      // Hash password
      user.password = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2**16,
        timeCost: 3,
        parallelism: 1
      });
      
      // Clear reset token fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();
      
      return { success: true };
    } catch (error) {
      console.error('Reset password service error:', error);
      return { success: false, message: 'Error resetting password' };
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token) {
    // Create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    
    // Create a transporter using Ethereal email
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    // Prepare email content
    const mailOptions = {
      to: email,
      from: `${process.env.APP_NAME} <${testAccount.user}>`,
      subject: `${process.env.APP_NAME} - Password Reset`,
      text: `Hello,

You are receiving this email because a password reset was requested for your ${process.env.APP_NAME} account.

Please click on the following link, or paste it into your browser to complete the process:
${process.env.APP_URL}/auth/reset-password/${token}

This link will expire in 1 hour.

If you did not request this reset, please ignore this email and your password will remain unchanged.

Thank you,
The ${process.env.APP_NAME} Team`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Log preview URL for testing
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    return info;
  }
}

module.exports = new AuthService();