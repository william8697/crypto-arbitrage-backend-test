const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Trade } = require('./db');
const router = express.Router();
const auth = require('./middleware/auth');

// Protect routes
router.use(auth);

// Get current user
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -loginHistory');
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

// Update user profile
router.patch('/update', async (req, res) => {
  try {
    const { firstName, lastName, country, currency } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, country, currency },
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

// Change password
router.patch('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user trades
router.get('/trades', async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.id }).sort('-createdAt');
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

// Get user balance
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('balance');
    res.status(200).json({
      status: 'success',
      data: {
        balance: user.balance
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;