import express, { json, urlencoded } from "express";
import session from "express-session";
import { join } from "path";
import dotenv from "dotenv";
dotenv.config();

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
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("\nSIGINT received, shutting down gracefully...");
    process.exit(0);
});
