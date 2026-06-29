import db from '../config/database.js';

// Indianapolis coordinates
const INDIANAPOLIS = {
    latitude: 39.7684,
    longitude: -86.1581,
    method: 2  // ISNA calculation method
};

// Fetch prayer times from AlAdhan API for a given date
export async function fetchPrayerTimes(date) {
    try {
        const timestamp = Math.floor(date.getTime() / 1000);
        const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${INDIANAPOLIS.latitude}&longitude=${INDIANAPOLIS.longitude}&method=${INDIANAPOLIS.method}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.code !== 200 || !data.data || !data.data.timings) {
            throw new Error('Invalid API response');
        }

        return {
            fajr: data.data.timings.Fajr,
            dhuhr: data.data.timings.Dhuhr,
            asr: data.data.timings.Asr,
            maghrib: data.data.timings.Maghrib,
            isha: data.data.timings.Isha
        };
    } catch (error) {
        console.error('Error fetching prayer times from API:', error);
        throw error;
    }
}

// Cache prayer times in database
export function cachePrayerTimes(date, times) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO prayer_times (date, fajr, dhuhr, asr, maghrib, isha)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            dateStr,
            times.fajr,
            times.dhuhr,
            times.asr,
            times.maghrib,
            times.isha
        );

        console.log(`Prayer times cached for ${dateStr}`);
    } catch (error) {
        console.error('Error caching prayer times:', error);
        throw error;
    }
}

// Get prayer times from cache
export function getPrayerTimesFromCache(date) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const stmt = db.prepare('SELECT * FROM prayer_times WHERE date = ?');
        const row = stmt.get(dateStr);

        if (row) {
            return {
                fajr: row.fajr,
                dhuhr: row.dhuhr,
                asr: row.asr,
                maghrib: row.maghrib,
                isha: row.isha
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting prayer times from cache:', error);
        return null;
    }
}

// Get today's prayer times (from cache or API)
export async function getTodayPrayerTimes() {
    const today = new Date();

    // Try to get from cache first
    let times = getPrayerTimesFromCache(today);

    if (times) {
        console.log('Using cached prayer times for today');
        return times;
    }

    // If not cached, fetch from API
    console.log('Fetching prayer times from API for today');
    try {
        times = await fetchPrayerTimes(today);
        cachePrayerTimes(today, times);
        return times;
    } catch (error) {
        console.error('Failed to get today\'s prayer times:', error);
        throw new Error('Unable to fetch prayer times. Please try again later.');
    }
}

// Get tomorrow's prayer times (for midnight rollover)
export async function getTomorrowPrayerTimes() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Try to get from cache first
    let times = getPrayerTimesFromCache(tomorrow);

    if (times) {
        console.log('Using cached prayer times for tomorrow');
        return times;
    }

    // If not cached, fetch from API
    console.log('Fetching prayer times from API for tomorrow');
    try {
        times = await fetchPrayerTimes(tomorrow);
        cachePrayerTimes(tomorrow, times);
        return times;
    } catch (error) {
        console.error('Failed to get tomorrow\'s prayer times:', error);
        throw error;
    }
}

// Calculate prayer time with offset
export function calculatePrayerTimeWithOffset(prayerTime, offsetMinutes) {
    // prayerTime is in HH:MM format
    const [hour, minute] = prayerTime.split(':').map(Number);

    // Calculate total minutes
    const totalMinutes = hour * 60 + minute + offsetMinutes;

    // Calculate new hour and minute (handle day rollover)
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;

    // Return in HH:MM format
    return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
}

// Fetch and cache today's prayer times (for initialization)
export async function fetchAndCacheTodayPrayerTimes() {
    try {
        const today = new Date();
        const times = await fetchPrayerTimes(today);
        cachePrayerTimes(today, times);
        console.log('Successfully fetched and cached today\'s prayer times');
        return times;
    } catch (error) {
        console.error('Error in fetchAndCacheTodayPrayerTimes:', error);
        throw error;
    }
}

// Fetch and cache tomorrow's prayer times (for midnight update)
export async function fetchAndCacheTomorrowPrayerTimes() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const times = await fetchPrayerTimes(tomorrow);
        cachePrayerTimes(tomorrow, times);
        console.log('Successfully fetched and cached tomorrow\'s prayer times');
        return times;
    } catch (error) {
        console.error('Error in fetchAndCacheTomorrowPrayerTimes:', error);
        throw error;
    }
}

export default {
    fetchPrayerTimes,
    getTodayPrayerTimes,
    getTomorrowPrayerTimes,
    cachePrayerTimes,
    getPrayerTimesFromCache,
    calculatePrayerTimeWithOffset,
    fetchAndCacheTodayPrayerTimes,
    fetchAndCacheTomorrowPrayerTimes
};
