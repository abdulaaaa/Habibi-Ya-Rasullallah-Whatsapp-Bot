import db from "../config/database.js";

function getAllMessages() {
    const messages = db.prepare("SELECT * FROM messages").all();
    return messages;
}

function getMessageById(id) {
    return db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
}

function createMessage(data) {
    const stmt = db.prepare(`
        INSERT INTO messages (message_content, send_time, days_of_week, schedule_type, prayer_name, prayer_offset)
        VALUES (?, ?, ?, ?, ?, ?)
        `);
    const result = stmt.run(
        data.messageContent,
        data.sendTime || null,  // Null for prayer-based schedules
        data.daysOfWeek,
        data.scheduleType || 'fixed',
        data.prayerName || null,
        data.prayerOffset || 10
    );
    return result.lastInsertRowid;
}

function updateMessage(id, data) {
    const stmt = db.prepare(`
    UPDATE messages
    SET message_content = ?, send_time = ?, days_of_week = ?, schedule_type = ?, prayer_name = ?, prayer_offset = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

    stmt.run(
        data.messageContent,
        data.sendTime || null,
        data.daysOfWeek,
        data.scheduleType || 'fixed',
        data.prayerName || null,
        data.prayerOffset || 10,
        id
    );
}

function deleteMessage(id) {
    db.prepare("DELETE FROM messages WHERE id = ?").run(id);
}

function toggleMessage(id, isActive) {
    db.prepare(
        "UPDATE messages SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(isActive ? 1 : 0, id);
}

function getPrayerBasedMessages() {
    return db.prepare("SELECT * FROM messages WHERE schedule_type = 'prayer' AND is_active = 1").all();
}

function getActiveMessages() {
    return db.prepare("SELECT * FROM messages WHERE is_active = 1").all();
}

export {
    getAllMessages,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage,
    toggleMessage,
    getPrayerBasedMessages,
    getActiveMessages,
};
