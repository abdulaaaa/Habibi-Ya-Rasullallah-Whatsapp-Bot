import Database from "better-sqlite3";
import { readFileSync } from "fs";

const db = new Database("db.sqlite");
db.pragma("journal_mode = WAL");

const schema = readFileSync("src/models/schema.sql").toString();
db.exec(schema);

db.exec(`INSERT INTO messages (message_content, send_time, days_of_week, is_active)
VALUES (
    'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ

Peace and blessings be upon Prophet Muhammad ﷺ',
    '12:00',
    '*',
    0
) ON CONFLICT DO NOTHING;`);

export default db;
