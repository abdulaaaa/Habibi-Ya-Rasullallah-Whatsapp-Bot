/**
 * Test file for Scheduler Service
 * Run with: node test-scheduler.js
 */

import * as schedulerService from './src/services/schedulerService.js';

console.log('Testing Scheduler Service\n');

// Initialize (without WhatsApp/Message services for now)
schedulerService.initialize({
    whatsappService: null,
    messageService: null
});

console.log('\n--- Test 1: Add a schedule for daily at 14:30 ---');
try {
    schedulerService.addSchedule(
        1,
        '14:30',
        '*',
        'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ\n\nPeace and blessings be upon Prophet Muhammad ﷺ'
    );
} catch (error) {
    console.error('Error:', error.message);
}

console.log('\n--- Test 2: Add a schedule for Mon, Wed, Fri at 18:00 ---');
try {
    schedulerService.addSchedule(
        2,
        '18:00',
        '1,3,5',
        'Salawat message for Mon, Wed, Fri'
    );
} catch (error) {
    console.error('Error:', error.message);
}

console.log('\n--- Test 3: Add INVALID time (should fail) ---');
try {
    schedulerService.addSchedule(
        3,
        '25:99',  // Invalid time
        '*',
        'This should fail'
    );
} catch (error) {
    console.error('Expected error:', error.message);
}

console.log('\n--- Test 4: Update schedule for message 1 ---');
try {
    schedulerService.updateSchedule(
        1,
        '09:00',  // Changed from 14:30 to 09:00
        '*',
        'Updated message content'
    );
} catch (error) {
    console.error('Error:', error.message);
}

console.log('\n--- Test 5: Check scheduler status ---');
const status = schedulerService.getStatus();
console.log('Status:', status);

console.log('\n--- Test 6: Add a test schedule (sends every minute) ---');
console.log('⚠️ This will log a message EVERY MINUTE for testing');
console.log('⚠️ Press Ctrl+C to stop\n');

const testId = schedulerService.addTestSchedule('Test message - every minute');

console.log('\nWaiting for scheduled messages...');
console.log('You should see a message every minute');
console.log('Press Ctrl+C to stop\n');

// Keep process alive to see scheduled messages
setInterval(() => {
    // Do nothing, just keep process alive
}, 10000);

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\n\nStopping all schedules...');
    schedulerService.stopAllSchedules();
    console.log('Goodbye!');
    process.exit(0);
});
