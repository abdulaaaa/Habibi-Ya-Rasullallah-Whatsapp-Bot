# Deployment Guide - Frontend (GitHub Pages) + Backend (VPS)

This project has been restructured to separate frontend and backend for independent deployment.

## Project Structure

```
/
├── frontend/          # Static files for GitHub Pages
│   ├── index.html    # Login page
│   ├── dashboard.html # Dashboard (to be created)
│   ├── config.js     # API configuration
│   ├── css/          # Styles
│   └── js/           # Client-side JavaScript
│
└── backend/          # Node.js API server for VPS
    ├── src/          # Server code
    ├── .env          # Environment variables
    └── package.json  # Dependencies
```

## Frontend Deployment (GitHub Pages)

### 1. Update API Configuration

Edit `frontend/config.js`:
```javascript
const API_BASE_URL = 'https://your-vps-domain.com'; // Your VPS URL
```

### 2. Deploy to GitHub Pages

**Option A: Using GitHub Actions (Recommended)**
```bash
# Push frontend folder to gh-pages branch
cd frontend
git init
git add -A
git commit -m "Deploy frontend"
git push -f https://github.com/yourusername/your-repo.git main:gh-pages
```

**Option B: Using GitHub Settings**
1. Push `frontend/` folder to your repository
2. Go to Settings > Pages
3. Select branch and `/frontend` folder
4. Save

**Option C: Manual HTML File**
1. Go to your repository settings
2. Enable GitHub Pages
3. Upload all files from `frontend/` directory

### 3. Access Your Frontend

Your frontend will be available at:
```
https://yourusername.github.io/repo-name/
```

## Backend Deployment (VPS)

### 1. Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- PM2 for process management
- Nginx as reverse proxy (optional but recommended)

### 2. Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (optional)
sudo apt install -y nginx
```

### 3. Deploy Backend Code

```bash
# Copy backend folder to VPS
scp -r backend/ user@your-vps-ip:/home/user/habibi-bot/

# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /home/user/habibi-bot/backend

# Install dependencies
npm install

# Configure environment
nano .env
# Update these values:
# - FRONTEND_URL=https://yourusername.github.io/repo-name
# - NODE_ENV=production
# - TARGET_GROUP_ID=your-whatsapp-group-id
```

### 4. Configure Environment Variables

Update `backend/.env`:
```env
# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$...  # Keep your hash

# Session
SESSION_SECRET=your-random-secret

# Server
PORT=3000
NODE_ENV=production

# Frontend URL - YOUR GITHUB PAGES URL
FRONTEND_URL=https://yourusername.github.io/repo-name

# Paths
WHATSAPP_SESSION_PATH=./data/whatsapp-session
DATABASE_PATH=./data/database.sqlite

# WhatsApp
TARGET_GROUP_ID=120363...@g.us

# Logging
LOG_LEVEL=info
```

### 5. Start Backend with PM2

```bash
# Start app
pm2 start src/index.js --name habibi-bot

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you

# View logs
pm2 logs habibi-bot
```

### 6. Configure Nginx (Optional but Recommended)

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/habibi-bot
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-vps-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin "https://yourusername.github.io" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/habibi-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-vps-domain.com

# Auto-renewal is configured automatically
```

## WhatsApp Setup

### 1. First Time Authentication

```bash
# On VPS, view PM2 logs to see QR code
pm2 logs habibi-bot

# Or run directly to see QR code
cd /home/user/habibi-bot/backend
node src/index.js

# Scan the QR code with your WhatsApp
# Session will be saved in .wwebjs_auth/ folder
```

### 2. Set Target Group

1. After WhatsApp connects, go to your dashboard
2. Click "Select Group" button
3. Choose your group
4. Copy the group ID
5. Update `TARGET_GROUP_ID` in `.env`
6. Restart: `pm2 restart habibi-bot`

## Testing

### Local Testing

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Serve frontend
cd frontend
python3 -m http.server 8080

# Access at: http://localhost:8080
```

### Production Testing

1. Go to your GitHub Pages URL
2. Login with admin credentials
3. Check WhatsApp status (should be green "Connected")
4. Create a test scheduled message
5. Monitor VPS logs: `pm2 logs habibi-bot`

## Troubleshooting

### Frontend can't connect to backend

**Check:**
- CORS is enabled in backend
- `FRONTEND_URL` in backend `.env` matches your GitHub Pages URL
- Backend is running: `pm2 status`
- Firewall allows traffic on port 3000 (or 80/443 if using Nginx)

**Fix:**
```bash
# Check backend logs
pm2 logs habibi-bot

# Restart backend
pm2 restart habibi-bot
```

### WhatsApp not connecting

**Check:**
- WhatsApp session files exist: `ls -la backend/.wwebjs_auth/`
- Phone has internet connection
- QR code was scanned correctly

**Fix:**
```bash
# Clear session and re-authenticate
rm -rf backend/.wwebjs_auth/
pm2 restart habibi-bot
pm2 logs habibi-bot  # Scan new QR code
```

### Messages not sending

**Check:**
- Target group ID is correct in `.env`
- WhatsApp is connected (green badge in dashboard)
- Message is active (toggle switch)
- Scheduler logs show job execution

**Fix:**
```bash
# View scheduler logs
pm2 logs habibi-bot | grep "Scheduled send"

# Check database
cd backend
sqlite3 db.sqlite "SELECT * FROM messages WHERE is_active=1;"
```

## Maintenance

### View Logs
```bash
pm2 logs habibi-bot
```

### Restart Backend
```bash
pm2 restart habibi-bot
```

### Update Code
```bash
# On your local machine
git pull origin main
scp -r backend/ user@your-vps-ip:/home/user/habibi-bot/

# On VPS
cd /home/user/habibi-bot/backend
npm install  # If dependencies changed
pm2 restart habibi-bot
```

### Backup Database
```bash
# On VPS
cd /home/user/habibi-bot/backend
cp db.sqlite db.sqlite.backup-$(date +%Y%m%d)
```

## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong admin password** - Generate secure hash with bcrypt
3. **Enable HTTPS** - Always use SSL in production (Let's Encrypt is free)
4. **Firewall** - Only expose necessary ports (80, 443, 22)
5. **Keep updated** - Regularly update Node.js and dependencies

## Cost Estimate

- **Frontend (GitHub Pages)**: FREE
- **VPS (Basic)**: $5-10/month (DigitalOcean, Linode, Vultr)
- **Domain (Optional)**: $10-15/year
- **SSL Certificate**: FREE (Let's Encrypt)

**Total**: ~$5-10/month for VPS only

## Support

For issues, check:
1. PM2 logs: `pm2 logs habibi-bot`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Browser console (F12) for frontend errors
