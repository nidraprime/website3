const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

const User = require('../models/User');
const transporter = require('../config/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function makeLoginLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' }
  });
}

const customerLoginLimiter = makeLoginLimiter();
const adminLoginLimiter = makeLoginLimiter();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const googleLoginLimiter = makeLoginLimiter();
const completeSignupLimiter = makeLoginLimiter();


// CUSTOMER LOGIN
router.post('/customer-login', customerLoginLimiter, async (req, res) => {

  try {

    const { mobile, password } = req.body;

    if (typeof mobile !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user exists
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (!user.password) {
      return res.json({
        success: false,
        message: 'This account uses Google Sign-In. Please log in with Google.'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send response
    res.json({
      success: true,
      token,
      name: user.name,
      customerId: user.customerId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// ADMIN LOGIN
router.post('/admin-login', adminLoginLimiter, async (req, res) => {

  try {

    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const token = jwt.sign(
      { role: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Admin authenticated',
      token
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUBLIC CONFIG (safe-to-expose values needed by frontend JS)
router.get('/api/config', (req, res) => {
  res.json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});


// GOOGLE LOGIN / SIGNUP
router.post('/google-login', googleLoginLimiter, async (req, res) => {

  try {

    const { idToken } = req.body;

    if (typeof idToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google sign-in. Please try again.'
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Your Google email is not verified.'
      });
    }

    const { sub: googleId, email, name } = payload;

    // Returning Google user
    let user = await User.findOne({ googleId });

    // Existing admin-created account with a matching email — link it
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }

    if (user) {
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        name: user.name,
        customerId: user.customerId
      });
    }

    // Brand-new Google user — needs to add a mobile number before an account is created
    const signupToken = jwt.sign(
      { purpose: 'google-signup', googleId, email, name },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      needsMobile: true,
      signupToken,
      name,
      email
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// COMPLETE GOOGLE SIGNUP (collects mobile number, creates the account)
router.post('/complete-google-signup', completeSignupLimiter, async (req, res) => {

  try {

    const { signupToken, mobile } = req.body;

    if (typeof signupToken !== 'string' || typeof mobile !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile must be exactly 10 digits'
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'This signup session has expired. Please sign in with Google again.'
      });
    }

    if (decoded.purpose !== 'google-signup') {
      return res.status(400).json({
        success: false,
        message: 'Invalid signup session'
      });
    }

    const existingMobile = await User.findOne({ mobile });

    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered. Please contact support.'
      });
    }

    const existingGoogleId = await User.findOne({ googleId: decoded.googleId });

    if (existingGoogleId) {
      return res.status(409).json({
        success: false,
        message: 'This Google account is already registered. Please log in instead.'
      });
    }

    const customerId = await User.generateCustomerId();

    const user = await User.create({
      customerId,
      name: decoded.name,
      mobile,
      email: decoded.email,
      googleId: decoded.googleId
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      name: user.name,
      customerId: user.customerId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// FORGOT PASSWORD
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {

  const genericResponse = {
    success: true,
    message: 'If an account with that mobile number has an email on file, a password reset link has been sent to it.'
  };

  try {

    const { mobile } = req.body;

    if (typeof mobile !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const user = await User.findOne({ mobile });

    if (!user || !user.email) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset_password.html?token=${rawToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reset your NidraPrime password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your NidraPrime account password. Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });

    res.json(genericResponse);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// RESET PASSWORD
router.post('/reset-password', async (req, res) => {

  try {

    const { token, newPassword } = req.body;

    if (typeof token !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid or has expired. Please request a new one.'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in.'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;