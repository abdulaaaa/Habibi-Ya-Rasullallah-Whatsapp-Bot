import { Router } from 'express';
const router = Router();
import { requireAuth } from '../middleware/auth.js';
import { SUCCESS } from '../config/constants.js';
import * as messageService from '../services/messageService.js';
import * as schedulerService from '../services/schedulerService.js';
import * as whatsappService from '../services/whatsappService.js';

// Dashboard page
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

// ==========================================
// DASHBOARD APIS - Integrated with real services
// ==========================================

// GET /api/messages - List all messages
router.get('/api/messages', requireAuth, (req, res) => {
    try {
        console.log('Getting all messages from database');
        const messages = messageService.getAllMessages();
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve messages'
        });
    }
});

// POST /api/messages - Create new message
router.post('/api/messages', requireAuth, (req, res) => {
    try {
        const { message_content, send_time, days_of_week, is_active } = req.body;

        console.log('Creating message:', {
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

        // Create message in database
        const messageId = messageService.createMessage({
            messageContent: message_content,
            sendTime: send_time,
            daysOfWeek: days_of_week
        });

        // Set active status if provided
        if (is_active !== undefined) {
            messageService.toggleMessage(messageId, is_active);
        }

        // Add to scheduler if active
        if (is_active) {
            try {
                schedulerService.addSchedule(messageId, send_time, days_of_week, message_content);
                console.log(`Schedule added for message ${messageId}`);
            } catch (error) {
                console.error('Failed to schedule message:', error.message);
            }
        }

        console.log('Message created with ID:', messageId);

        res.json({
            success: true,
            messageId: messageId,
            message: SUCCESS.MESSAGE_CREATED
        });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create message'
        });
    }
});

// PUT /api/messages/:id - Update message
router.put('/api/messages/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { message_content, send_time, days_of_week, is_active } = req.body;

        console.log(`Updating message ${id}:`, {
            message_content: message_content?.substring(0, 50),
            send_time,
            days_of_week,
            is_active
        });

        // Check if message exists
        const existingMessage = messageService.getMessageById(parseInt(id));
        if (!existingMessage) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Update message in database
        messageService.updateMessage(
            parseInt(id),
            message_content || existingMessage.message_content,
            send_time || existingMessage.send_time,
            days_of_week || existingMessage.days_of_week
        );

        // Update active status if provided
        if (is_active !== undefined) {
            messageService.toggleMessage(parseInt(id), is_active);
        }

        // Get updated message
        const updatedMessage = messageService.getMessageById(parseInt(id));

        // Update scheduler if message is active
        if (updatedMessage.is_active) {
            try {
                schedulerService.updateSchedule(
                    parseInt(id),
                    updatedMessage.send_time,
                    updatedMessage.days_of_week,
                    updatedMessage.message_content
                );
                console.log(`Schedule updated for message ${id}`);
            } catch (error) {
                console.error('Failed to update schedule:', error.message);
            }
        } else {
            // Remove from scheduler if deactivated
            schedulerService.removeSchedule(parseInt(id));
        }

        console.log('Message updated:', id);

        res.json({
            success: true,
            message: SUCCESS.MESSAGE_UPDATED
        });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update message'
        });
    }
});

// DELETE /api/messages/:id - Delete message
router.delete('/api/messages/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        console.log(`Deleting message ${id}`);

        // Check if message exists
        const message = messageService.getMessageById(parseInt(id));
        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Remove from scheduler first
        schedulerService.removeSchedule(parseInt(id));

        // Delete from database
        messageService.deleteMessage(parseInt(id));

        console.log('Message deleted:', id);

        res.json({
            success: true,
            message: SUCCESS.MESSAGE_DELETED
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete message'
        });
    }
});

// PATCH /api/messages/:id/toggle - Toggle message active status
router.patch('/api/messages/:id/toggle', requireAuth, (req, res) => {
    try {
        const { id } = req.params;

        console.log(`Toggling message ${id}`);

        // Get current message
        const message = messageService.getMessageById(parseInt(id));
        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }

        // Toggle active status
        const newStatus = !message.is_active;
        messageService.toggleMessage(parseInt(id), newStatus);

        // Update scheduler
        if (newStatus) {
            // Activate: add to scheduler
            try {
                schedulerService.addSchedule(
                    parseInt(id),
                    message.send_time,
                    message.days_of_week,
                    message.message_content
                );
                console.log(`Schedule activated for message ${id}`);
            } catch (error) {
                console.error('Failed to activate schedule:', error.message);
            }
        } else {
            // Deactivate: remove from scheduler
            schedulerService.removeSchedule(parseInt(id));
            console.log(`Schedule deactivated for message ${id}`);
        }

        console.log(`Message toggled to ${newStatus ? 'active' : 'inactive'}:`, id);

        res.json({
            success: true,
            is_active: newStatus ? 1 : 0,
            message: SUCCESS.MESSAGE_UPDATED
        });
    } catch (error) {
        console.error('Error toggling message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to toggle message'
        });
    }
});

// GET /api/whatsapp/status - WhatsApp connection status
router.get('/api/whatsapp/status', requireAuth, (req, res) => {
    try {
        console.log('Getting WhatsApp status');
        const connected = whatsappService.isConnected();

        res.json({
            connected: connected
        });
    } catch (error) {
        console.error('Error getting WhatsApp status:', error);
        res.json({
            connected: false
        });
    }
});

// GET /api/whatsapp/groups - Get list of available groups
router.get('/api/whatsapp/groups', requireAuth, async (req, res) => {
    try {
        console.log('Getting WhatsApp groups');

        if (!whatsappService.isConnected()) {
            return res.status(400).json({
                success: false,
                error: 'WhatsApp is not connected. Please scan QR code first.'
            });
        }

        const groups = await whatsappService.getGroups();

        console.log(`Found ${groups.length} groups`);

        res.json({
            success: true,
            groups: groups
        });
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get groups'
        });
    }
});

// POST /api/whatsapp/set-group - Set target group
router.post('/api/whatsapp/set-group', requireAuth, (req, res) => {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                error: 'Group ID is required'
            });
        }

        console.log('Setting target group:', groupId);

        whatsappService.setTargetGroup(groupId);

        console.log('Target group set. Update TARGET_GROUP_ID in .env to persist this setting.');

        res.json({
            success: true,
            message: 'Target group set successfully. Update .env file to persist this setting.'
        });
    } catch (error) {
        console.error('Error setting target group:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to set target group'
        });
    }
});

// POST /api/whatsapp/test - Send test message
router.post('/api/whatsapp/test', requireAuth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message content is required'
            });
        }

        console.log('Sending test message:', message?.substring(0, 50));

        await whatsappService.sendMessageToGroup(message);

        console.log('Test message sent successfully');

        res.json({
            success: true,
            message: SUCCESS.MESSAGE_SENT
        });
    } catch (error) {
        console.error('Error sending test message:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send test message'
        });
    }
});

// GET /api/schedule/next - Get next execution times
router.get('/api/schedule/next', requireAuth, (req, res) => {
    try {
        console.log('Getting next execution times');

        // Get all active messages
        const activeMessages = messageService.getAllMessages().filter(m => m.is_active);

        // Get next execution times from scheduler
        const nextTimes = activeMessages.map(m => ({
            messageId: m.id,
            nextRun: 'Calculating...', // TODO: Calculate actual next run time from cron
            message: m.message_content.substring(0, 50) + (m.message_content.length > 50 ? '...' : ''),
            schedule: `${m.send_time} on ${m.days_of_week === '*' ? 'every day' : 'days ' + m.days_of_week}`
        }));

        res.json(nextTimes);
    } catch (error) {
        console.error('Error getting next execution times:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get execution times'
        });
    }
});

export default router;
