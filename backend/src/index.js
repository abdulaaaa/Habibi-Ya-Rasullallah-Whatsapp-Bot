import express, { json, urlencoded } from "express";
import session from "express-session";
import { join } from "path";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

// Import services
import * as whatsappService from './services/whatsappService.js';
import * as messageService from './services/messageService.js';
import * as schedulerService from './services/schedulerService.js';
import * as prayerTimesService from './services/prayerTimesService.js';

const app = express();

// CORS Configuration - Allow frontend from GitHub Pages
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080', // Will be GitHub Pages URL
    credentials: true, // Allow cookies
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
            sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Required for CORS
        },
    }),
);

// Routes (coming next)
import routes from "./routes/index.js";
app.use("/", routes);

// Error handler (basic)
app.use((err, req, res, next) => {
    console.error("Error:", err);

    // API error response
    if (req.path.startsWith("/api")) {
        return res.status(err.status || 500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }

    // Page error response
    res.status(err.status || 500).send(`
        <h1>Error ${err.status || 500}</h1>
        <p>${err.message || "Something went wrong"}</p>
        <a href="/">Go back home</a>
    `);
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({
            success: false,
            error: "API endpoint not found",
        });
    }

    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <a href="/">Go back home</a>
    `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log('');

    // Initialize prayer times service
    console.log('Fetching today\'s prayer times for Indianapolis (EST)...');
    try {
        const prayerTimes = await prayerTimesService.fetchAndCacheTodayPrayerTimes();

        // Helper to format time to 12-hour with AM/PM
        const formatTime = (time24) => {
            const [hour24, minute] = time24.split(':').map(Number);
            const hour12 = hour24 % 12 || 12;
            const ampm = hour24 >= 12 ? 'PM' : 'AM';
            return `${hour12}:${String(minute).padStart(2, '0')} ${ampm} EST`;
        };

        console.log('Prayer times loaded:');
        console.log(`  Fajr: ${formatTime(prayerTimes.fajr)}`);
        console.log(`  Dhuhr: ${formatTime(prayerTimes.dhuhr)}`);
        console.log(`  Asr: ${formatTime(prayerTimes.asr)}`);
        console.log(`  Maghrib: ${formatTime(prayerTimes.maghrib)}`);
        console.log(`  Isha: ${formatTime(prayerTimes.isha)}`);
    } catch (error) {
        console.error('Failed to fetch prayer times:', error.message);
        console.log('Scheduler will attempt to fetch prayer times when needed');
    }
    console.log('');

    // Initialize WhatsApp client
    console.log('Initializing WhatsApp client...');
    whatsappService.initializeClient();

    // Initialize scheduler service with dependencies
    console.log('Initializing scheduler service...');
    schedulerService.initialize({
        whatsappService: whatsappService,
        messageService: messageService
    });

    // Load all active schedules from database
    console.log('Loading active message schedules...');
    await schedulerService.initializeSchedules();

    console.log('');
    console.log('All services initialized!');
    console.log('Scan the QR code above (if shown) to connect WhatsApp');
    console.log('Once connected, scheduled messages will be sent automatically');
    console.log('');
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log("\nSIGTERM received, shutting down gracefully...");
    console.log("Stopping all scheduled jobs...");
    schedulerService.stopAllSchedules();
    console.log("Goodbye!");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("\n\nSIGINT received, shutting down gracefully...");
    console.log("Stopping all scheduled jobs...");
    schedulerService.stopAllSchedules();
    console.log("Goodbye!");
    process.exit(0);
});
