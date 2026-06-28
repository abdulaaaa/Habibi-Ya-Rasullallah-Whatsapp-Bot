const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Dashboard page
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

// API routes will be added in Hour 3-4 with MOCK data
// For now, just placeholder

module.exports = router;
