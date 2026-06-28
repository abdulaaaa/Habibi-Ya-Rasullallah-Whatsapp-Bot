import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

let client = null;
let connected = false;
let targetGroupId = null; // Will be set from database config

function initializeClient() {
    client = new Client({
        puppeteer: {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        authStrategy: new LocalAuth({
            dataPath: "./.wwebjs_auth",
        }),
    });

    client.once("ready", () => {
        connected = true;
        console.log("WhatsApp client is ready");

        // Load target group from environment
        if (process.env.TARGET_GROUP_ID) {
            targetGroupId = process.env.TARGET_GROUP_ID;
            console.log("Target group loaded from config:", targetGroupId);
        } else {
            console.log("No target group configured. Use /api/whatsapp/groups to list groups and set TARGET_GROUP_ID in .env");
        }
    });

    client.on("disconnected", (reason) => {
        connected = false;
        console.log("Client disconnected:", reason);
    });

    client.on("qr", (qr) => {
        console.log("Scan this QR code to connect.");
        qrcode.generate(qr, { small: true });
    });

    client.on("authenticated", () => {
        console.log("Authenticated successfully");
    });

    client.on("auth_failure", (msg) => {
        connected = false;
        console.error("Authentication failed:", msg);
    });

    client.initialize();
    return client;
}

/**
 * Check if WhatsApp is connected
 * @returns {boolean} Connection status
 */
function isConnected() {
    return connected;
}

/**
 * Get list of all groups
 * @returns {Promise<Array>} List of groups
 */
async function getGroups() {
    if (!client || !connected) {
        throw new Error('WhatsApp not connected');
    }

    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    return groups.map(group => ({
        id: group.id._serialized,
        name: group.name
    }));
}

/**
 * Set target group ID
 * @param {string} groupId - Group ID to send messages to
 */
function setTargetGroup(groupId) {
    targetGroupId = groupId;
    console.log('Target group set:', groupId);
}

/**
 * Send message to target group
 * @param {string} message - Message content to send
 * @returns {Promise<void>}
 */
async function sendMessageToGroup(message) {
    if (!client || !connected) {
        throw new Error('WhatsApp not connected');
    }

    if (!targetGroupId) {
        throw new Error('Target group not set');
    }

    await client.sendMessage(targetGroupId, message);
    console.log('Message sent to group');
}

/**
 * Send scheduled message (called by scheduler)
 * @param {number} messageId - Message ID (for logging)
 * @param {string} content - Message content
 * @returns {Promise<void>}
 */
async function sendScheduledMessage(messageId, content) {
    console.log(`📤 Sending scheduled message ${messageId}...`);
    await sendMessageToGroup(content);
}

export {
    initializeClient,
    isConnected,
    getGroups,
    setTargetGroup,
    sendMessageToGroup,
    sendScheduledMessage
};
