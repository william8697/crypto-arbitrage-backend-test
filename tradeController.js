const express = require('express');
const { User, Trade } = require('./db');
const router = express.Router();
const auth = require('./middleware/auth');

// Protect routes
router.use(auth);

// Execute arbitrage trade
router.post('/execute', async (req, res) => {
  try {
    const { pair, amount } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!pair || !amount) {
      return res.status(400).json({ message: 'Please provide pair and amount' });
    }

    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum trade amount is $100' });
    }

    // Get user
    const user = await User.findById(userId);
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Calculate profit (using your existing arbitrage logic)
    // This is where your frontend arbitrage logic would integrate
    // For now, we'll simulate a profit between 1-5%
    const profitPercentage = 1 + Math.random() * 4; // 1-5%
    const profit = (amount * profitPercentage) / 100;
    const total = amount + profit;

    // Create trade
    const trade = await Trade.create({
      userId,
      pair,
      amount,
      profit,
      status: 'completed'
    });

    // Update user balance
    user.balance = user.balance + profit;
    await user.save();

    res.status(201).json({
      status: 'success',
      data: {
        trade,
        newBalance: user.balance
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all trades
router.get('/', async (req, res) => {
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

module.exports = router;