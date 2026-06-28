# Habibi Ya Rasulallah - WhatsApp Bot

Automated WhatsApp bot for sending scheduled salawat messages to a WhatsApp group. Built with Node.js and deployed with a separated frontend (GitHub Pages) and backend (VPS) architecture.

## Features

- **Multiple Scheduled Messages**: Create and manage multiple custom messages, each with its own schedule
- **Flexible Scheduling**: Configure time (HH:MM) and days of the week for each message
- **Admin Dashboard**: Web-based UI to manage messages and monitor WhatsApp connection
- **WhatsApp Integration**: Uses whatsapp-web.js for reliable WhatsApp messaging
- **Real-time Status**: Monitor WhatsApp connection status from the dashboard
- **Secure Authentication**: Login protected with bcrypt password hashing
- **Separated Architecture**: Frontend on GitHub Pages (free), Backend on VPS

## Architecture

This project is split into two parts for independent deployment:

### Frontend (GitHub Pages)
- Static HTML/CSS/JavaScript
- Bootstrap 5 UI
- Connects to backend API via CORS
- **FREE hosting** on GitHub Pages

### Backend (VPS)
- Node.js + Express API server
- SQLite database
- WhatsApp client (whatsapp-web.js)
- Cron-based scheduler (node-cron)
- Deployed on any VPS ($5-10/month)

## Quick Start

### Local Development

**1. Clone the repository:**
\`\`\`bash
git clone https://github.com/yourusername/Habibi-Ya-Rasullallah-Whatsapp-Bot.git
cd Habibi-Ya-Rasullallah-Whatsapp-Bot
\`\`\`

**2. Setup Backend:**
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
\`\`\`

**3. Setup Frontend:**
\`\`\`bash
cd ../frontend
# Serve with any static server
python3 -m http.server 8080
# Or use: npx http-server -p 8080
\`\`\`

**4. Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Login: admin / admin123 (default)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3
- Fetch API for backend communication

### Backend
- Node.js 18+
- Express.js - Web framework
- whatsapp-web.js - WhatsApp integration
- node-cron - Task scheduling
- better-sqlite3 - Database
- bcryptjs - Password hashing
- cors - Cross-origin resource sharing

## License

This project is open source and available under the MIT License.

---

**Note**: This project requires a dedicated phone number for WhatsApp.
