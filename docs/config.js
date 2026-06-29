// API Configuration
// Automatically detects environment and uses correct backend URL
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://habibi-ya-rasullallah-whatsapp-bot-production.up.railway.app';

export default API_BASE_URL;
