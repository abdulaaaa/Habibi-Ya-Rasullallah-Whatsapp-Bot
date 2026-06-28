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
        INSERT INTO messages (message_content, send_time, days_of_week)
        VALUES (?, ?, ?)
        `);
    const result = stmt.run(
        data.messageContent,
        data.sendTime,
        data.daysOfWeek,
    );
    return result.lastInsertRowid;
}

function updateMessage(id, messageContent, sendTime, daysOfWeek) {
    const stmt = db.prepare(`
    UPDATE messages
    SET message_content = ?, send_time = ?, days_of_week = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

    stmt.run(messageContent, sendTime, daysOfWeek, id);
}

function deleteMessage(id) {
    db.prepare("DELETE FROM messages WHERE id = ?").run(id);
}

function toggleMessage(id, isActive) {
    db.prepare(
        "UPDATE messages SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(isActive ? 1 : 0, id);
}

export {
    getAllMessages,
    getMessageById,
    createMessage,
    updateMessage,
    deleteMessage,
    toggleMessage,
};
