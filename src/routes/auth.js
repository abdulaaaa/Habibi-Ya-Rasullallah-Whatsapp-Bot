const express = require('express');
const router = express.Router();
const { requireGuest } = require('../middleware/auth');
const constants = require('../config/constants');

// Login page
router.get('/', requireGuest, (req, res) => {
    res.render('login');
});

// ==========================================
// MOCK AUTH APIS (Hour 2-3)
// These will be replaced with real auth in Hour 6-7
// ==========================================

// MOCK Login API - Accepts ANY credentials for now
router.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // MOCK: Log the attempt
    console.log('🔐 Mock Login Attempt:', { username, password: '***' });

    // MOCK: Accept any credentials
    if (username && password) {
        req.session.isAuthenticated = true;
        req.session.username = username;

        console.log('✅ Mock Login Success:', username);

        return res.json({
            success: true,
            message: constants.SUCCESS.LOGIN
        });
    }

    // If no credentials provided
    console.log('❌ Mock Login Failed: Missing credentials');
    return res.status(400).json({
        success: false,
        error: 'Username and password are required'
    });
});

// Logout API
router.post('/api/auth/logout', (req, res) => {
    const username = req.session.username;

    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to logout'
            });
        }

        console.log('👋 User logged out:', username);
        res.json({
            success: true,
            message: constants.SUCCESS.LOGOUT
        });
    });
});

module.exports = router;
