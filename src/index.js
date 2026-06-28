import express, { json, urlencoded } from "express";
import session from "express-session";
import { join } from "path";
import dotenv from "dotenv";
dotenv.config();

// Import services
import * as whatsappService from './services/whatsappService.js';
import * as messageService from './services/messageService.js';
import * as schedulerService from './services/schedulerService.js';

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "views");

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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log('');

    // Initialize WhatsApp client
    console.log('📱 Initializing WhatsApp client...');
    whatsappService.initializeClient();

    // Initialize scheduler service with dependencies
    console.log('📅 Initializing scheduler service...');
    schedulerService.initialize({
        whatsappService: whatsappService,
        messageService: messageService
    });

    // Load all active schedules from database
    console.log('📅 Loading active message schedules...');
    schedulerService.initializeSchedules();

    console.log('');
    console.log('✅ All services initialized!');
    console.log('💡 Scan the QR code above (if shown) to connect WhatsApp');
    console.log('💡 Once connected, scheduled messages will be sent automatically');
    console.log('');
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log("\nSIGTERM received, shutting down gracefully...");
    console.log("🛑 Stopping all scheduled jobs...");
    schedulerService.stopAllSchedules();
    console.log("👋 Goodbye!");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("\n\nSIGINT received, shutting down gracefully...");
    console.log("🛑 Stopping all scheduled jobs...");
    schedulerService.stopAllSchedules();
    console.log("👋 Goodbye!");
    process.exit(0);
});
