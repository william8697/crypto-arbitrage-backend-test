require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const rateLimit = require('rate-limiter-flexible').RateLimiterMemory;

// Import routes
const authRoutes = require('./authController');
const userRoutes = require('./userController');
const tradeRoutes = require('./tradeController');
const adminRoutes = require('./adminController');
const supportRoutes = require('./supportController');

// Initialize app
const app = express();

// Rate limiting
const limiter = new rateLimit({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

// Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// Apply rate limiting to all requests
app.use((req, res, next) => {
  limiter.consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ message: 'Too many requests' }));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Database connection
const DB = process.env.MONGODB_URI.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('DB connection successful!'));

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});