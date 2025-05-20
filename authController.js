const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { User } = require('./db');
const router = express.Router();
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, country, currency, walletAddress } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || !country) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { walletAddress }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or wallet address' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      country,
      currency,
      walletAddress
    });

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Send welcome email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Crypto Arbitrage Trading',
      html: `<p>Hi ${firstName},</p>
             <p>Your account has been successfully created!</p>
             <p>Start trading now and take advantage of arbitrage opportunities.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          walletAddress: newUser.walletAddress,
          balance: newUser.balance
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;

    // Check if email or wallet address is provided
    if (!email && !walletAddress) {
      return res.status(400).json({ message: 'Please provide email or wallet address' });
    }

    // Find user
    let user;
    if (email) {
      user = await User.findOne({ email }).select('+password');
    } else {
      user = await User.findOne({ walletAddress });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password if email login
    if (email) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Update last login
    user.lastLogin = Date.now();
    user.loginHistory.push(Date.now());
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          walletAddress: user.walletAddress,
          balance: user.balance
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '10m'
    });

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Hi ${user.firstName},</p>
             <p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>This link will expire in 10 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;