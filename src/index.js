import { initializeClient } from "./services/whatsappService.js";
import { createMessage, getAllMessages } from "./services/messageService.js";

// initializeClient();

const msg = createMessage({
    messageContent: "Test",
    sendTime: "14:30",
    daysOfWeek: "*",
});
console.log("Created:", msg);
console.log("All messages:", getAllMessages());
