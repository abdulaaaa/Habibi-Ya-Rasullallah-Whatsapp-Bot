CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_content TEXT NOT NULL,

    -- Scheduling
    send_time TEXT NOT NULL,              -- "HH:MM" format (24-hour)
    days_of_week TEXT NOT NULL,           -- Comma-separated: "0,1,2,3,4,5,6" or "*"

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
