import { Router } from 'express';
const router = Router();
import { requireGuest } from '../middleware/auth.js';
import { SUCCESS, ERRORS } from '../config/constants.js';
import bcrypt from 'bcryptjs';

// Login page
router.get('/', requireGuest, (req, res) => {
    res.render('login');
});

// ==========================================
// AUTHENTICATION APIS
// ==========================================

// Login API - Real authentication with bcrypt
router.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Login Attempt:', { username, password: '***' });

        // Validate input
        if (!username || !password) {
            console.log('Login Failed: Missing credentials');
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        // Check username
        const validUsername = process.env.ADMIN_USERNAME;
        if (username !== validUsername) {
            console.log('Login Failed: Invalid username');
            return res.status(401).json({
                success: false,
                error: ERRORS.INVALID_CREDENTIALS
            });
        }

        // Check password with bcrypt
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        const isValidPassword = await bcrypt.compare(password, passwordHash);

        if (!isValidPassword) {
            console.log('Login Failed: Invalid password');
            return res.status(401).json({
                success: false,
                error: ERRORS.INVALID_CREDENTIALS
            });
        }

        // Successful login
        req.session.isAuthenticated = true;
        req.session.username = username;

        console.log('Login Success:', username);

        return res.json({
            success: true,
            message: SUCCESS.LOGIN
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: ERRORS.SERVER_ERROR
        });
    }
});

// Logout API
router.post('/api/auth/logout', (req, res) => {
    const username = req.session.username;

    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to logout'
            });
        }

        console.log('User logged out:', username);
        res.json({
            success: true,
            message: SUCCESS.LOGOUT
        });
    });
});

export default router;
