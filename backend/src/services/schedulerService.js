import cron from 'node-cron';

// Store active cron jobs (messageId -> cron job)
const jobs = new Map();

// Store for WhatsApp service (will be injected)
let whatsappService = null;
let messageService = null;

/**
 * Initialize scheduler with services
 * @param {Object} services - { whatsappService, messageService }
 */
function initialize(services) {
    whatsappService = services.whatsappService;
    messageService = services.messageService;
    console.log('Scheduler service initialized');
}

/**
 * Initialize schedules from database
 * Loads all active messages and creates cron jobs for them
 */
function initializeSchedules() {
    console.log('Initializing schedules...');

    // For now, this is a placeholder
    // When messageService is ready, it will load from database
    if (messageService && messageService.getAllMessages) {
        const messages = messageService.getAllMessages();
        const activeMessages = messages.filter(m => m.is_active);

        console.log(`Found ${activeMessages.length} active messages to schedule`);

        activeMessages.forEach(msg => {
            try {
                addSchedule(msg.id, msg.send_time, msg.days_of_week, msg.message_content);
            } catch (error) {
                console.error(`Failed to schedule message ${msg.id}:`, error.message);
            }
        });

        console.log(`Initialized ${jobs.size} scheduled jobs`);
    } else {
        console.log('Message service not available yet - schedules will be initialized later');
    }
}

/**
 * Add a new schedule for a message
 * @param {number} messageId - Message ID
 * @param {string} time - Time in HH:MM format
 * @param {string} days - Days of week (comma-separated 0-6, or "*" for all)
 * @param {string} content - Message content to send
 */
function addSchedule(messageId, time, days, content) {
    // Remove existing job if any
    removeSchedule(messageId);

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
        timezone: 'America/New_York' // Change to your timezone
    });

    jobs.set(messageId, job);

    // Log schedule info
    const daysFormatted = days === '*' ? 'Every day' : `Days: ${days}`;
    console.log(`Scheduled message ${messageId}: ${time} - ${daysFormatted}`);

    return job;
}

/**
 * Update an existing schedule
 * @param {number} messageId - Message ID
 * @param {string} time - New time in HH:MM format
 * @param {string} days - New days of week
 * @param {string} content - New message content
 */
function updateSchedule(messageId, time, days, content) {
    console.log(`Updating schedule for message ${messageId}`);

    // Remove old schedule
    removeSchedule(messageId);

    // Add new schedule
    addSchedule(messageId, time, days, content);

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

export {
    initialize,
    initializeSchedules,
    addSchedule,
    updateSchedule,
    removeSchedule,
    stopAllSchedules,
    getNextExecutionTimes,
    getStatus,
    addTestSchedule
};
