const express = require('express');
const router = express.Router();
const { requireGuest } = require('../middleware/auth');

// Login page
router.get('/', requireGuest, (req, res) => {
    res.render('login');
});

// Auth routes will be added in Hour 2-3
// For now, just placeholder

module.exports = router;
