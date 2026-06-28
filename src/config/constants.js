// Application constants

module.exports = {
    // Error messages
    ERRORS: {
        UNAUTHORIZED: 'Unauthorized access',
        INVALID_CREDENTIALS: 'Invalid username or password',
        SERVER_ERROR: 'Internal server error',
        NOT_FOUND: 'Resource not found',
        VALIDATION_ERROR: 'Validation error'
    },

    // Success messages
    SUCCESS: {
        LOGIN: 'Login successful',
        LOGOUT: 'Logout successful',
        MESSAGE_CREATED: 'Message created successfully',
        MESSAGE_UPDATED: 'Message updated successfully',
        MESSAGE_DELETED: 'Message deleted successfully',
        MESSAGE_SENT: 'Message sent successfully'
    },

    // Session
    SESSION: {
        MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
        COOKIE_NAME: 'connect.sid'
    },

    // Default salawat message
    DEFAULT_MESSAGE: `اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ

Peace and blessings be upon Prophet Muhammad ﷺ`
};
