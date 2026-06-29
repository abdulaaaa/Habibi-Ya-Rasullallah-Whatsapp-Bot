import cron from 'node-cron';
import * as prayerTimesService from './prayerTimesService.js';

// Store active cron jobs (messageId -> cron job)
const jobs = new Map();

// Store for WhatsApp service (will be injected)
let whatsappService = null;
let messageService = null;

// Store midnight update job
let midnightUpdateJob = null;

/**
 * Initialize scheduler with services
 * @param {Object} services - { whatsappService, messageService }
 */
function initialize(services) {
    whatsappService = services.whatsappService;
    messageService = services.messageService;
    console.log('Scheduler service initialized');

    // Start midnight update job for prayer-based messages
    startMidnightUpdateJob();
}

/**
 * Initialize schedules from database
 * Loads all active messages and creates cron jobs for them
 */
async function initializeSchedules() {
    console.log('Initializing schedules...');

    if (messageService && messageService.getAllMessages) {
        const messages = messageService.getAllMessages();
        const activeMessages = messages.filter(m => m.is_active);

        console.log(`Found ${activeMessages.length} active messages to schedule`);

        // Fetch today's prayer times if we have prayer-based messages
        const prayerMessages = activeMessages.filter(m => m.schedule_type === 'prayer');
        if (prayerMessages.length > 0) {
            try {
                await prayerTimesService.getTodayPrayerTimes();
                console.log('Prayer times loaded successfully');
            } catch (error) {
                console.error('Failed to load prayer times:', error.message);
            }
        }

        for (const msg of activeMessages) {
            try {
                await addSchedule(msg.id, msg);
            } catch (error) {
                console.error(`Failed to schedule message ${msg.id}:`, error.message);
            }
        }

        console.log(`Initialized ${jobs.size} scheduled jobs`);
    } else {
        console.log('Message service not available yet - schedules will be initialized later');
    }
}

/**
 * Add a new schedule for a message (supports both fixed and prayer-based)
 * @param {number} messageId - Message ID
 * @param {Object} message - Message object with all details
 */
async function addSchedule(messageId, message) {
    // Remove existing job if any
    removeSchedule(messageId);

    let time, days, content;

    // Determine if this is a prayer-based or fixed schedule
    if (message.schedule_type === 'prayer') {
        // Prayer-based schedule
        days = message.days_of_week;
        content = message.message_content;

        try {
            const prayerTimes = await prayerTimesService.getTodayPrayerTimes();
            const prayerTime = prayerTimes[message.prayer_name];

            if (!prayerTime) {
                throw new Error(`Prayer time not found for ${message.prayer_name}`);
            }

            time = prayerTimesService.calculatePrayerTimeWithOffset(
                prayerTime,
                message.prayer_offset || 10
            );

            // Format for logging
            const formatTimeLog = (t) => {
                const [h, m] = t.split(':').map(Number);
                const h12 = h % 12 || 12;
                const ampm = h >= 12 ? 'PM' : 'AM';
                return `${h12}:${String(m).padStart(2, '0')} ${ampm} EST`;
            };

            console.log(`Prayer-based schedule: ${message.prayer_name} at ${formatTimeLog(prayerTime)} + ${message.prayer_offset}min = ${formatTimeLog(time)}`);
        } catch (error) {
            console.error(`Failed to get prayer time for message ${messageId}:`, error.message);
            throw error;
        }
    } else {
        // Fixed schedule (original behavior)
        time = message.send_time || message;
        days = message.days_of_week || arguments[2];
        content = message.message_content || arguments[3];
    }

    // Parse time
    const [hour, minute] = time.split(':');

    if (!hour || !minute) {
        throw new Error('Invalid time format. Use HH:MM');
    }

    // Validate time
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);

    if (hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59) {
        throw new Error('Invalid time. Hour must be 0-23, minute must be 0-59');
    }

    // Build cron expression
    // Format: minute hour day month weekday
    // Example: "30 14 * * 1,3,5" = 2:30 PM on Mon, Wed, Fri
    const cronExpression = `${minute} ${hour} * * ${days}`;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Create cron job
    const job = cron.schedule(cronExpression, async () => {
        console.log(`Scheduled send triggered for message ${messageId}`);
        console.log(`Content: ${content.substring(0, 50)}...`);

        try {
            if (whatsappService && whatsappService.sendScheduledMessage) {
                await whatsappService.sendScheduledMessage(messageId, content);
                console.log(`Message ${messageId} sent successfully`);
            } else {
                console.log(`WhatsApp service not available - would send: "${content.substring(0, 30)}..."`);
            }
        } catch (error) {
            console.error(`Failed to send message ${messageId}:`, error.message);
        }
    }, {
        scheduled: true,
        timezone: 'America/Indianapolis'  // EST/EDT (Eastern Time)
    });

    jobs.set(messageId, job);

    // Log schedule info - format time to 12-hour
    const formatTime = (time24) => {
        const [hour24, minute] = time24.split(':').map(Number);
        const hour12 = hour24 % 12 || 12;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${String(minute).padStart(2, '0')} ${ampm} EST`;
    };

    const daysFormatted = days === '*' ? 'Every day' : `Days: ${days}`;
    const scheduleType = message.schedule_type === 'prayer' ? `Prayer (${message.prayer_name})` : 'Fixed';
    const timeFormatted = formatTime(time);
    console.log(`Scheduled message ${messageId} [${scheduleType}]: ${timeFormatted} - ${daysFormatted}`);

    return job;
}

/**
 * Update an existing schedule
 * @param {number} messageId - Message ID
 * @param {Object} message - Message object with new details
 */
async function updateSchedule(messageId, message) {
    console.log(`Updating schedule for message ${messageId}`);

    // Remove old schedule
    removeSchedule(messageId);

    // Add new schedule
    await addSchedule(messageId, message);

    console.log(`Schedule updated for message ${messageId}`);
}

/**
 * Remove a schedule
 * @param {number} messageId - Message ID
 */
function removeSchedule(messageId) {
    const job = jobs.get(messageId);

    if (job) {
        job.stop();
        jobs.delete(messageId);
        console.log(`Removed schedule for message ${messageId}`);
    }
}

/**
 * Stop all schedules
 */
function stopAllSchedules() {
    console.log(`Stopping all ${jobs.size} scheduled jobs...`);

    jobs.forEach((job, messageId) => {
        job.stop();
        console.log(`Stopped job for message ${messageId}`);
    });

    jobs.clear();
    console.log('All schedules stopped');
}

/**
 * Get next execution times for all active jobs
 * @returns {Array} Array of { messageId, nextRun }
 */
function getNextExecutionTimes() {
    const nextTimes = [];

    jobs.forEach((job, messageId) => {
        // Note: node-cron doesn't provide next execution time directly
        // This is a placeholder - you'd need to calculate it based on cron expression
        nextTimes.push({
            messageId,
            nextRun: 'Calculating...' // TODO: Implement actual calculation
        });
    });

    return nextTimes;
}

/**
 * Get status of scheduler
 * @returns {Object} Status information
 */
function getStatus() {
    return {
        activeJobs: jobs.size,
        jobs: Array.from(jobs.keys())
    };
}

/**
 * Test function to add a message that sends every minute
 * @param {string} content - Test message content
 */
function addTestSchedule(content = 'Test message from scheduler') {
    const testId = 9999;

    // Every minute: "* * * * *"
    const job = cron.schedule('* * * * *', () => {
        console.log(`TEST: Sending message every minute`);
        console.log(`Content: ${content}`);

        if (whatsappService && whatsappService.sendScheduledMessage) {
            whatsappService.sendScheduledMessage(testId, content)
                .then(() => console.log('Test message sent'))
                .catch(err => console.error('Test send failed:', err.message));
        } else {
            console.log('WhatsApp service not available - mock send');
        }
    });

    jobs.set(testId, job);
    console.log('Test schedule added - will send every minute');

    return testId;
}

/**
 * Reschedule all prayer-based messages (called at midnight)
 */
async function reschedulePrayerBasedMessages() {
    console.log('Rescheduling all prayer-based messages with new prayer times...');

    if (!messageService || !messageService.getPrayerBasedMessages) {
        console.log('Message service not available - skipping reschedule');
        return;
    }

    try {
        // Fetch tomorrow's prayer times (since we're running at midnight)
        await prayerTimesService.fetchAndCacheTodayPrayerTimes();

        // Get all prayer-based messages
        const prayerMessages = messageService.getPrayerBasedMessages();
        console.log(`Found ${prayerMessages.length} prayer-based messages to reschedule`);

        // Reschedule each one
        for (const msg of prayerMessages) {
            try {
                await updateSchedule(msg.id, msg);
                console.log(`Rescheduled message ${msg.id}`);
            } catch (error) {
                console.error(`Failed to reschedule message ${msg.id}:`, error.message);
            }
        }

        console.log('Prayer-based messages rescheduled successfully');
    } catch (error) {
        console.error('Error rescheduling prayer-based messages:', error);
    }
}

/**
 * Start the midnight update job for prayer times
 */
function startMidnightUpdateJob() {
    if (midnightUpdateJob) {
        console.log('Midnight update job already running');
        return;
    }

    // Run at 00:01 every day to update prayer times and reschedule messages
    midnightUpdateJob = cron.schedule('1 0 * * *', async () => {
        console.log('=== MIDNIGHT UPDATE: Updating prayer times for new day ===');

        try {
            await reschedulePrayerBasedMessages();
        } catch (error) {
            console.error('Error in midnight update:', error);
        }
    }, {
        scheduled: true,
        timezone: 'America/Indianapolis'  // EST/EDT (Eastern Time)
    });

    console.log('Midnight update job started - will update prayer times daily at 00:01');
}

/**
 * Stop the midnight update job
 */
function stopMidnightUpdateJob() {
    if (midnightUpdateJob) {
        midnightUpdateJob.stop();
        midnightUpdateJob = null;
        console.log('Midnight update job stopped');
    }
}

export {
    initialize,
    initializeSchedules,
    addSchedule,
    updateSchedule,
    removeSchedule,
    stopAllSchedules,
    getNextExecutionTimes,
    getStatus,
    addTestSchedule,
    reschedulePrayerBasedMessages,
    startMidnightUpdateJob,
    stopMidnightUpdateJob
};
