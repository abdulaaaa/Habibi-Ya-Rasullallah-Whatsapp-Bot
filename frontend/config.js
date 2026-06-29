// API Configuration
// Automatically detects environment and uses correct backend URL
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://YOUR_RAILWAY_APP_NAME.railway.app'; // Replace with your Railway URL after deployment

export default API_BASE_URL;
