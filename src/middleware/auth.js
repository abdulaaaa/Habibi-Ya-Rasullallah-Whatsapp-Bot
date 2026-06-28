// Authentication middleware

const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    // For API routes, return JSON error
    if (req.path.startsWith('/api')) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized access. Please login.'
        });
    }

    // For page routes, redirect to login
    res.redirect('/');
};

const requireGuest = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return res.redirect('/dashboard');
    }
    next();
};

module.exports = {
    requireAuth,
    requireGuest
};
