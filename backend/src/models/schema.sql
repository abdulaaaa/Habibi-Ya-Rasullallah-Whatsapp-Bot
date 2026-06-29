CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_content TEXT NOT NULL,

    -- Scheduling
    send_time TEXT,                       -- "HH:MM" format (24-hour) - nullable for prayer-based schedules
    days_of_week TEXT NOT NULL,           -- Comma-separated: "0,1,2,3,4,5,6" or "*"
    schedule_type TEXT DEFAULT 'fixed',   -- 'fixed' or 'prayer'
    prayer_name TEXT,                     -- 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'
    prayer_offset INTEGER DEFAULT 10,     -- Minutes after prayer time

    -- Status
    is_active BOOLEAN DEFAULT 1,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Single row
    target_group_id TEXT,
    target_group_name TEXT,
    is_whatsapp_connected BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prayer_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,  -- "YYYY-MM-DD"
    fajr TEXT NOT NULL,          -- "HH:MM"
    dhuhr TEXT NOT NULL,         -- "HH:MM"
    asr TEXT NOT NULL,           -- "HH:MM"
    maghrib TEXT NOT NULL,       -- "HH:MM"
    isha TEXT NOT NULL,          -- "HH:MM"
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
