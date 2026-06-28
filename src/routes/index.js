const express = require('express');
const router = express.Router();

// Import route modules (will be created next)
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');

// Mount routes
router.use('/', authRoutes);
router.use('/', dashboardRoutes);

module.exports = router;
