import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

let client = null;
let connected = false;

function initializeClient() {
    const client = new Client({
        puppeteer: {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        authStrategy: new LocalAuth({
            dataPath: "./.wwebjs_auth",
        }),
    });

    client.once("ready", () => {
        connected = true;
        console.log("Client is ready");
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
        console.log("✅ Authenticated successfully");
        currentQR = null;
    });

    client.on("auth_failure", (msg) => {
        connected = false;
        console.error("Authentication failed:", msg);
    });

    client.initialize();
    return client;
}

export { initializeClient };
