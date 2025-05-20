const express = require('express');
const { User, Trade, SupportTicket } = require('./db');
const router = express.Router();
const auth = require('./middleware/auth');
const admin = require('./middleware/admin');

// Protect routes and check admin
router.use(auth, admin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -loginHistory');
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -loginHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (admin)
router.patch('/users/:id', async (req, res) => {
  try {
    const { balance, isVerified, isAdmin } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { balance, isVerified, isAdmin },
      { new: true, runValidators: true }
    ).select('-password -loginHistory');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all trades
router.get('/trades', async (req, res) => {
  try {
    const trades = await Trade.find().sort('-createdAt').populate('userId', 'firstName lastName email');
    res.status(200).json({
      status: 'success',
      results: trades.length,
      data: {
        trades
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all support tickets
router.get('/support-tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort('-createdAt').populate('userId', 'firstName lastName email');
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: {
        tickets
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update support ticket status
router.patch('/support-tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    res.status(200).json({
      status: 'success',
      data: {
        ticket
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;