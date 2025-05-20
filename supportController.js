const express = require('express');
const { SupportTicket, User } = require('./db');
const router = express.Router();
const auth = require('./middleware/auth');

// Create support ticket
router.post('/', auth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ message: 'Please provide subject and message' });
    }

    // Get user
    const user = await User.findById(userId);

    // Create ticket
    const ticket = await SupportTicket.create({
      userId,
      email: user.email,
      subject,
      message,
      status: 'open'
    });

    res.status(201).json({
      status: 'success',
      data: {
        ticket
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's support tickets
router.get('/my-tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort('-createdAt');
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

module.exports = router;