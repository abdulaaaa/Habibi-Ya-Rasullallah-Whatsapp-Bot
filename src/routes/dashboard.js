import { Router } from 'express';
const router = Router();
import { requireAuth } from '../middleware/auth.js';
import { SUCCESS } from '../config/constants.js';

// Dashboard page
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

// ==========================================
// MOCK DASHBOARD APIS (Hour 3-4)
// These will be replaced with real controllers in Hour 6-7
// ==========================================

// Mock message data
let mockMessages = [
    {
        id: 1,
        message_content: 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ\n\nPeace and blessings be upon Prophet Muhammad ﷺ',
        send_time: '12:00',
        days_of_week: '*',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        message_content: 'صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ\n\nMay Allah bless him and grant him peace',
        send_time: '18:00',
        days_of_week: '1,3,5',
        is_active: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

let nextId = 3;

// GET /api/messages - List all messages
router.get('/api/messages', requireAuth, (req, res) => {
    console.log('📋 Mock: Getting all messages');
    res.json(mockMessages);
});

// POST /api/messages - Create new message
router.post('/api/messages', requireAuth, (req, res) => {
    const { message_content, send_time, days_of_week, is_active } = req.body;

    console.log('➕ Mock: Creating message:', {
        message_content: message_content?.substring(0, 50) + '...',
        send_time,
        days_of_week,
        is_active
    });

    // Validation
    if (!message_content || !send_time || !days_of_week) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    // Create mock message
    const newMessage = {
        id: nextId++,
        message_content,
        send_time,
        days_of_week,
        is_active: is_active ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    mockMessages.push(newMessage);

    console.log('✅ Mock: Message created with ID:', newMessage.id);

    res.json({
        success: true,
        messageId: newMessage.id,
        message: SUCCESS.MESSAGE_CREATED
    });
});

// PUT /api/messages/:id - Update message
router.put('/api/messages/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { message_content, send_time, days_of_week, is_active } = req.body;

    console.log(`✏️ Mock: Updating message ${id}:`, {
        message_content: message_content?.substring(0, 50),
        send_time,
        days_of_week,
        is_active
    });

    const messageIndex = mockMessages.findIndex(m => m.id === parseInt(id));

    if (messageIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Message not found'
        });
    }

    // Update message
    if (message_content !== undefined) mockMessages[messageIndex].message_content = message_content;
    if (send_time !== undefined) mockMessages[messageIndex].send_time = send_time;
    if (days_of_week !== undefined) mockMessages[messageIndex].days_of_week = days_of_week;
    if (is_active !== undefined) mockMessages[messageIndex].is_active = is_active ? 1 : 0;
    mockMessages[messageIndex].updated_at = new Date().toISOString();

    console.log('✅ Mock: Message updated:', id);

    res.json({
        success: true,
        message: SUCCESS.MESSAGE_UPDATED
    });
});

// DELETE /api/messages/:id - Delete message
router.delete('/api/messages/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    console.log(`🗑️ Mock: Deleting message ${id}`);

    const messageIndex = mockMessages.findIndex(m => m.id === parseInt(id));

    if (messageIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Message not found'
        });
    }

    mockMessages.splice(messageIndex, 1);

    console.log('✅ Mock: Message deleted:', id);

    res.json({
        success: true,
        message: SUCCESS.MESSAGE_DELETED
    });
});

// PATCH /api/messages/:id/toggle - Toggle message active status
router.patch('/api/messages/:id/toggle', requireAuth, (req, res) => {
    const { id } = req.params;

    console.log(`🔄 Mock: Toggling message ${id}`);

    const message = mockMessages.find(m => m.id === parseInt(id));

    if (!message) {
        return res.status(404).json({
            success: false,
            error: 'Message not found'
        });
    }

    message.is_active = message.is_active ? 0 : 1;
    message.updated_at = new Date().toISOString();

    console.log(`✅ Mock: Message toggled to ${message.is_active ? 'active' : 'inactive'}:`, id);

    res.json({
        success: true,
        is_active: message.is_active,
        message: SUCCESS.MESSAGE_UPDATED
    });
});

// GET /api/whatsapp/status - WhatsApp connection status
router.get('/api/whatsapp/status', requireAuth, (req, res) => {
    console.log('📱 Mock: Getting WhatsApp status');

    // MOCK: Return connected status
    res.json({
        connected: true // Will be false until real WhatsApp service is integrated
    });
});

// POST /api/whatsapp/test - Send test message
router.post('/api/whatsapp/test', requireAuth, (req, res) => {
    const { message } = req.body;

    console.log('📤 Mock: Sending test message:', message?.substring(0, 50));

    // MOCK: Simulate sending
    setTimeout(() => {
        console.log('✅ Mock: Test message "sent"');
    }, 500);

    res.json({
        success: true,
        message: SUCCESS.MESSAGE_SENT
    });
});

// GET /api/schedule/next - Get next execution times
router.get('/api/schedule/next', requireAuth, (req, res) => {
    console.log('📅 Mock: Getting next execution times');

    // MOCK: Return fake next execution times
    const nextTimes = mockMessages
        .filter(m => m.is_active)
        .map(m => ({
            messageId: m.id,
            nextRun: new Date(Date.now() + Math.random() * 86400000).toISOString(), // Random time in next 24h
            message: m.message_content.substring(0, 50) + '...'
        }));

    res.json(nextTimes);
});

export default router;
