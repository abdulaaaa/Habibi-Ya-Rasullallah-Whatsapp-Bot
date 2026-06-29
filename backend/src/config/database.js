import Database from "better-sqlite3";
import { readFileSync } from "fs";

const db = new Database("db.sqlite");
db.pragma("journal_mode = WAL");

const schema = readFileSync("src/models/schema.sql").toString();
db.exec(schema);

// Migration: Add new columns to existing messages table if they don't exist
try {
    const tableInfo = db.prepare("PRAGMA table_info(messages)").all();
    const columnNames = tableInfo.map(col => col.name);
    const sendTimeColumn = tableInfo.find(col => col.name === 'send_time');

    // Check if we need to migrate the table to make send_time nullable
    const needsMigration = sendTimeColumn && sendTimeColumn.notnull === 1;

    if (needsMigration || !columnNames.includes('schedule_type')) {
        console.log('Migrating messages table to support prayer-based schedules...');

        // Create new table with correct schema
        db.exec(`
            CREATE TABLE IF NOT EXISTS messages_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_content TEXT NOT NULL,
                send_time TEXT,
                days_of_week TEXT NOT NULL,
                schedule_type TEXT DEFAULT 'fixed',
                prayer_name TEXT,
                prayer_offset INTEGER DEFAULT 10,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Copy data from old table to new table
        const existingMessages = db.prepare('SELECT * FROM messages').all();
        if (existingMessages.length > 0) {
            const insert = db.prepare(`
                INSERT INTO messages_new
                (id, message_content, send_time, days_of_week, schedule_type, prayer_name, prayer_offset, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const msg of existingMessages) {
                insert.run(
                    msg.id,
                    msg.message_content,
                    msg.send_time,
                    msg.days_of_week,
                    msg.schedule_type || 'fixed',
                    msg.prayer_name || null,
                    msg.prayer_offset || 10,
                    msg.is_active,
                    msg.created_at,
                    msg.updated_at
                );
            }
        }

        // Drop old table and rename new table
        db.exec('DROP TABLE messages');
        db.exec('ALTER TABLE messages_new RENAME TO messages');

        console.log('Messages table migration completed successfully');
    } else {
        // Just add columns if they don't exist (for new installations)
        if (!columnNames.includes('schedule_type')) {
            console.log('Adding schedule_type column to messages table...');
            db.exec(`ALTER TABLE messages ADD COLUMN schedule_type TEXT DEFAULT 'fixed'`);
        }

        if (!columnNames.includes('prayer_name')) {
            console.log('Adding prayer_name column to messages table...');
            db.exec(`ALTER TABLE messages ADD COLUMN prayer_name TEXT`);
        }

        if (!columnNames.includes('prayer_offset')) {
            console.log('Adding prayer_offset column to messages table...');
            db.exec(`ALTER TABLE messages ADD COLUMN prayer_offset INTEGER DEFAULT 10`);
        }
    }
} catch (error) {
    console.error('Error during database migration:', error);
}

db.exec(`INSERT INTO messages (message_content, send_time, days_of_week, is_active)
VALUES (
    'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ

Peace and blessings be upon Prophet Muhammad ﷺ',
    '12:00',
    '*',
    0
) ON CONFLICT DO NOTHING;`);

export default db;
