# Implementation Plan: Habibi Ya Rasulallah WhatsApp Bot

## Project Overview
A Node.js WhatsApp bot that sends scheduled salawat messages to a WhatsApp group, with a minimal admin web UI for managing multiple custom messages and their schedules.

**Working Directory**: `/Users/abdul/Documents/Projects/Habibi-Ya-Rasullallah-Whatsapp-Bot`

## User Requirements (Confirmed)
- ✅ WhatsApp integration via whatsapp-web.js
- ✅ QR code authentication via command line/console
- ✅ Fixed single WhatsApp group (configured during setup)
- ✅ Admin web UI with shared username/password
- ✅ **Multiple custom messages** - each with its own schedule
- ✅ Each message has: content, time, days of week
- ✅ Default message: Both Arabic and English salawat combined
- ✅ Two developers working together

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **WhatsApp**: whatsapp-web.js
- **Scheduler**: node-cron
- **Database**: SQLite with better-sqlite3
- **Auth**: express-session + bcryptjs
- **Environment**: dotenv
- **Logging**: Winston

### Frontend
- **UI**: Bootstrap 5 + vanilla JavaScript
- **Templates**: EJS (server-side rendering)

## Project Structure

```
/Users/abdul/Documents/Projects/Habibi-Ya-Rasullallah-Whatsapp-Bot/
├── .gitignore
├── package.json
├── .env.example
├── .env (gitignored)
│
├── src/
│   ├── index.js                      # Application entry point
│   │
│   ├── config/
│   │   ├── database.js               # SQLite setup
│   │   └── constants.js              # App constants
│   │
│   ├── services/
│   │   ├── whatsappService.js        # WhatsApp connection & messaging
│   │   ├── schedulerService.js       # Multiple message scheduling
│   │   └── messageService.js         # CRUD for messages
│   │
│   ├── controllers/
│   │   ├── authController.js         # Login/logout
│   │   └── dashboardController.js    # Dashboard API endpoints
│   │
│   ├── middleware/
│   │   ├── auth.js                   # Auth middleware
│   │   └── errorHandler.js           # Error handling
│   │
│   ├── routes/
│   │   ├── auth.js                   # Auth routes
│   │   ├── dashboard.js              # Dashboard routes
│   │   └── index.js                  # Route aggregator
│   │
│   ├── models/
│   │   └── schema.sql                # Database schema
│   │
│   └── utils/
│       ├── logger.js                 # Winston logger
│       └── validation.js             # Input validation
│
├── views/
│   ├── login.ejs                     # Login page
│   ├── dashboard.ejs                 # Admin dashboard
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
│
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── dashboard.js              # Frontend logic
│
├── data/                             # Gitignored
│   ├── database.sqlite
│   └── whatsapp-session/
│
└── logs/                             # Gitignored
    └── app.log
```

## Data Model

### Messages Table (SQLite)
**Key Change**: Multiple messages instead of single configuration

```sql
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Message content
    message_content TEXT NOT NULL,

    -- Scheduling
    send_time TEXT NOT NULL,              -- "HH:MM" format (24-hour)
    days_of_week TEXT NOT NULL,           -- Comma-separated: "0,1,2,3,4,5,6" or "*"

    -- Status
    is_active BOOLEAN DEFAULT 1,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Single row
    target_group_id TEXT,
    target_group_name TEXT,
    is_whatsapp_connected BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default message (both Arabic and English)
INSERT INTO messages (message_content, send_time, days_of_week, is_active)
VALUES (
    'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ

Peace and blessings be upon Prophet Muhammad ﷺ',
    '12:00',
    '*',
    0
) ON CONFLICT DO NOTHING;
```

## Core Components

### 1. WhatsApp Service (`src/services/whatsappService.js`)
**Responsibilities**:
- Initialize whatsapp-web.js client with LocalAuth
- Display QR code in terminal (qrcode-terminal)
- Maintain connection state
- Send messages to configured group
- List available groups (for initial setup)

**Key Functions**:
```javascript
initializeClient()
getQRCode() // Returns QR for console display
isConnected()
sendMessageToGroup(groupId, message)
getGroups() // For selecting target group
```

### 2. Scheduler Service (`src/services/schedulerService.js`)
**Responsibilities**:
- Manage multiple cron jobs (one per active message)
- Load all active messages from database on startup
- Create/update/delete cron jobs dynamically
- Convert time + days_of_week into cron expressions

**Key Functions**:
```javascript
initializeSchedules() // Load all active messages and create cron jobs
addSchedule(messageId, time, days, content)
updateSchedule(messageId, time, days, content)
removeSchedule(messageId)
stopAllSchedules()
getNextExecutionTimes() // For all active messages
```

**Cron Expression Logic**:
```javascript
// Example: send_time="14:30", days_of_week="1,3,5" (Mon, Wed, Fri)
// Cron: "30 14 * * 1,3,5"
const [hour, minute] = send_time.split(':');
const cronExpression = `${minute} ${hour} * * ${days_of_week}`;
```

### 3. Message Service (`src/services/messageService.js`)
**Responsibilities**:
- CRUD operations for messages table
- Validate message data (time format, days range)
- Coordinate with scheduler when messages change

**Key Functions**:
```javascript
getAllMessages()
getMessageById(id)
createMessage(data)
updateMessage(id, data)
deleteMessage(id)
toggleMessageActive(id)
```

### 4. Dashboard Controller (`src/controllers/dashboardController.js`)
**API Endpoints**:
```javascript
GET    /api/messages              // List all messages
POST   /api/messages              // Create new message
PUT    /api/messages/:id          // Update message
DELETE /api/messages/:id          // Delete message
PATCH  /api/messages/:id/toggle   // Enable/disable message

GET    /api/whatsapp/status       // Connection status
GET    /api/whatsapp/groups       // List groups (for setup)
POST   /api/config/group          // Set target group
POST   /api/whatsapp/test         // Send test message

GET    /api/schedule/next         // Next execution times
```

### 5. Dashboard UI (`views/dashboard.ejs`)
**Features**:
- WhatsApp connection status indicator
- Target group display
- **Messages List** (table/cards):
  - Message content preview
  - Schedule (time + days)
  - Active/Inactive toggle
  - Edit button
  - Delete button
- **Add Message Form**:
  - Message content (textarea, RTL support for Arabic)
  - Time picker (HH:MM)
  - Days of week checkboxes (Sun-Sat)
  - Active checkbox
  - Submit button
- Test message button
- Logout button

## Implementation Phases

### Phase 1: Project Setup (Day 1)
**Both developers collaborate**

1. Create `.gitignore`:
   ```
   node_modules/
   .env
   data/
   logs/
   *.log
   .DS_Store
   ```

2. Initialize `package.json` with dependencies:
   ```json
   {
     "name": "habibi-ya-rasulallah-bot",
     "version": "1.0.0",
     "description": "WhatsApp bot for scheduled salawat messages",
     "main": "src/index.js",
     "scripts": {
       "start": "node src/index.js",
       "dev": "nodemon src/index.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "express-session": "^1.17.3",
       "whatsapp-web.js": "^1.23.0",
       "qrcode-terminal": "^0.12.0",
       "node-cron": "^3.0.3",
       "better-sqlite3": "^9.2.2",
       "bcryptjs": "^2.4.3",
       "dotenv": "^16.3.1",
       "winston": "^3.11.0",
       "ejs": "^3.1.9"
     },
     "devDependencies": {
       "nodemon": "^3.0.2"
     }
   }
   ```

3. Create `.env.example`:
   ```env
   # Admin Credentials
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=$2a$10$... # bcrypt hash of your password

   # Session
   SESSION_SECRET=generate-random-secret-here

   # Server
   PORT=3000
   NODE_ENV=development

   # Paths
   WHATSAPP_SESSION_PATH=./data/whatsapp-session
   DATABASE_PATH=./data/database.sqlite

   # Logging
   LOG_LEVEL=info
   ```

4. Run `npm install`

5. Create folder structure

6. Create `src/models/schema.sql` with database schema

7. Set up logger utility (`src/utils/logger.js`)

**Deliverable**: Project scaffolding complete, dependencies installed

---

### Phase 2: Backend - WhatsApp Integration (Day 2-3)
**Developer A (Backend)**

**Files to create**:
- `src/config/database.js` - SQLite initialization
- `src/config/constants.js` - App constants
- `src/services/whatsappService.js` - WhatsApp client
- `src/utils/validation.js` - Input validators

**Implementation Details**:

1. **Database Setup** (`src/config/database.js`):
   - Initialize SQLite connection
   - Run schema.sql on first startup
   - Export database instance

2. **WhatsApp Service** (`src/services/whatsappService.js`):
   ```javascript
   const { Client, LocalAuth } = require('whatsapp-web.js');
   const qrcode = require('qrcode-terminal');

   // Initialize with LocalAuth for session persistence
   client.on('qr', (qr) => {
       qrcode.generate(qr, { small: true });
       console.log('Scan QR code above to authenticate WhatsApp');
   });

   client.on('ready', () => {
       console.log('WhatsApp client is ready!');
       // Update app_config.is_whatsapp_connected = 1
   });

   client.on('disconnected', () => {
       console.log('WhatsApp disconnected, attempting reconnect...');
       // Update app_config.is_whatsapp_connected = 0
   });
   ```

3. **Testing**:
   - Run app and scan QR code from phone
   - Verify session persists after restart
   - Test sending a message manually
   - Test getGroups() function

**Deliverable**: WhatsApp integration working, can send messages

---

### Phase 3: Backend - Messages & Scheduling (Day 4-5)
**Developer A (Backend)**

**Files to create**:
- `src/services/messageService.js` - Message CRUD
- `src/services/schedulerService.js` - Cron job management

**Implementation Details**:

1. **Message Service** (`src/services/messageService.js`):
   - All CRUD operations
   - Validate time format (HH:MM, 00:00-23:59)
   - Validate days (0-6 or "*")
   - On create/update/delete: notify scheduler service

2. **Scheduler Service** (`src/services/schedulerService.js`):
   ```javascript
   const cron = require('node-cron');
   const jobs = new Map(); // messageId -> cron job

   function initializeSchedules() {
       const activeMessages = messageService.getAllMessages()
           .filter(m => m.is_active);

       activeMessages.forEach(msg => {
           addSchedule(msg.id, msg.send_time, msg.days_of_week, msg.message_content);
       });
   }

   function addSchedule(id, time, days, content) {
       const [hour, minute] = time.split(':');
       const cronExpression = `${minute} ${hour} * * ${days}`;

       if (!cron.validate(cronExpression)) {
           throw new Error('Invalid cron expression');
       }

       const job = cron.schedule(cronExpression, async () => {
           try {
               await whatsappService.sendMessageToGroup(groupId, content);
               logger.info(`Sent scheduled message ${id}`);
           } catch (error) {
               logger.error(`Failed to send message ${id}:`, error);
           }
       });

       jobs.set(id, job);
   }
   ```

3. **Testing**:
   - Create test message with 1-minute frequency
   - Verify cron job executes and sends message
   - Test updating schedule (job recreated)
   - Test deleting message (job stopped)
   - Test enable/disable toggle

**Deliverable**: Multiple messages can be scheduled independently

---

### Phase 4: Backend - Auth & API (Day 6)
**Developer A (Backend)**

**Files to create**:
- `src/middleware/auth.js` - Auth middleware
- `src/controllers/authController.js` - Login/logout
- `src/controllers/dashboardController.js` - Dashboard API

**Implementation Details**:

1. **Auth Middleware** (`src/middleware/auth.js`):
   ```javascript
   function requireAuth(req, res, next) {
       if (req.session && req.session.isAuthenticated) {
           next();
       } else {
           res.status(401).json({ error: 'Unauthorized' });
       }
   }
   ```

2. **Auth Controller** (`src/controllers/authController.js`):
   ```javascript
   async login(req, res) {
       const { username, password } = req.body;

       if (username !== process.env.ADMIN_USERNAME) {
           return res.status(401).json({ error: 'Invalid credentials' });
       }

       const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

       if (!isValid) {
           return res.status(401).json({ error: 'Invalid credentials' });
       }

       req.session.isAuthenticated = true;
       res.json({ success: true });
   }
   ```

3. **Dashboard Controller** - Implement all API endpoints listed earlier

**Deliverable**: All API endpoints functional, protected by auth

---

### Phase 5: Frontend - UI Development (Day 3-7)
**Developer B (Frontend)**

**Files to create**:
- `views/login.ejs` - Login page
- `views/dashboard.ejs` - Main dashboard
- `views/partials/header.ejs` - Common header
- `views/partials/footer.ejs` - Common footer
- `public/css/style.css` - Custom styles
- `public/js/dashboard.js` - Frontend logic

**Implementation Details**:

1. **Login Page** (`views/login.ejs`):
   - Simple centered form
   - Username and password fields
   - Submit button
   - Error message display
   - Bootstrap styling

2. **Dashboard Page** (`views/dashboard.ejs`):
   - **Header Section**:
     - WhatsApp status badge (connected/disconnected)
     - Target group name display
     - Logout button

   - **Messages Section**:
     - Table or card layout showing all messages
     - Each row/card shows:
       - Message content (truncated if long)
       - Schedule: "Daily at 14:30" or "Mon, Wed, Fri at 09:00"
       - Active/Inactive badge with toggle switch
       - Edit and Delete buttons
     - "Add New Message" button

   - **Add/Edit Message Modal**:
     - Textarea for message content (RTL support)
     - Time input (type="time")
     - Days checkboxes (Sun-Sat or "Every day")
     - Active checkbox
     - Save/Cancel buttons

   - **Actions Section**:
     - "Send Test Message" button
     - Shows next execution times for active messages

3. **Frontend JavaScript** (`public/js/dashboard.js`):
   ```javascript
   // Load messages on page load
   async function loadMessages() {
       const response = await fetch('/api/messages');
       const messages = await response.json();
       renderMessages(messages);
   }

   // Add new message
   async function addMessage(formData) {
       const response = await fetch('/api/messages', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(formData)
       });

       if (response.ok) {
           showNotification('Message added successfully');
           loadMessages();
       }
   }

   // Toggle message active status
   async function toggleMessage(id) {
       const response = await fetch(`/api/messages/${id}/toggle`, {
           method: 'PATCH'
       });

       if (response.ok) {
           loadMessages();
       }
   }

   // Delete message with confirmation
   async function deleteMessage(id) {
       if (!confirm('Are you sure you want to delete this message?')) {
           return;
       }

       const response = await fetch(`/api/messages/${id}`, {
           method: 'DELETE'
       });

       if (response.ok) {
           showNotification('Message deleted');
           loadMessages();
       }
   }
   ```

4. **Styling** (`public/css/style.css`):
   - RTL support for Arabic text
   - Responsive layout (mobile-friendly)
   - Custom colors matching theme
   - Status badges and icons

**Deliverable**: Complete UI for managing multiple messages

---

### Phase 6: Integration & Routes (Day 8-9)
**Developer B (Frontend/Integration)**

**Files to create**:
- `src/routes/auth.js` - Auth routes
- `src/routes/dashboard.js` - Dashboard routes
- `src/routes/index.js` - Route aggregator
- `src/index.js` - Express app entry point

**Implementation Details**:

1. **Express App Setup** (`src/index.js`):
   ```javascript
   const express = require('express');
   const session = require('express-session');
   const path = require('path');
   require('dotenv').config();

   const app = express();

   // Middleware
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));
   app.use(express.static('public'));
   app.set('view engine', 'ejs');
   app.set('views', path.join(__dirname, '../views'));

   // Session
   app.use(session({
       secret: process.env.SESSION_SECRET,
       resave: false,
       saveUninitialized: false,
       cookie: {
           httpOnly: true,
           maxAge: 24 * 60 * 60 * 1000 // 24 hours
       }
   }));

   // Initialize services
   const whatsappService = require('./services/whatsappService');
   const schedulerService = require('./services/schedulerService');

   // Routes
   const routes = require('./routes');
   app.use('/', routes);

   // Start server
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, async () => {
       console.log(`Server running on http://localhost:${PORT}`);

       // Initialize WhatsApp
       await whatsappService.initializeClient();

       // Initialize schedules
       schedulerService.initializeSchedules();
   });
   ```

2. **Route Files**:
   - `src/routes/auth.js`: Login/logout routes
   - `src/routes/dashboard.js`: All dashboard routes (protected)
   - `src/routes/index.js`: Combine and export all routes

3. **Testing**:
   - Test full user flow: login → view messages → add → edit → delete
   - Test WhatsApp connection status updates
   - Test scheduled sends
   - Test test message button
   - Test session persistence

**Deliverable**: Fully integrated application

---

### Phase 7: Testing & Documentation (Day 10-11)
**Both developers**

1. **End-to-End Testing**:
   - Test all features thoroughly
   - Test error scenarios (WhatsApp disconnect, invalid input)
   - Test with actual phone and WhatsApp group
   - Test multiple messages with different schedules
   - Test concurrent schedule execution

2. **Documentation**:
   - Update README.md with:
     - Setup instructions
     - How to generate password hash (bcrypt)
     - First-time WhatsApp authentication
     - Environment variables explanation
     - Running the app
     - Adding messages via UI
     - Troubleshooting

3. **Security Checklist**:
   - ✅ Passwords hashed with bcrypt
   - ✅ .env not committed to git
   - ✅ Session secret is random
   - ✅ SQL injection prevented (prepared statements)
   - ✅ Input validation on all endpoints
   - ✅ Auth middleware on protected routes

4. **Create Helper Script** (optional):
   - `scripts/generate-password-hash.js` - Generate bcrypt hash for password

**Deliverable**: Production-ready application with documentation

---

## Work Distribution

### Developer A: Backend Focus
**Responsibilities**:
- WhatsApp integration (Phase 2)
- Message & scheduling services (Phase 3)
- Auth & API controllers (Phase 4)
- Database setup and schema
- Logger and utilities
- Backend testing

**Key Files**:
- `src/services/whatsappService.js`
- `src/services/schedulerService.js`
- `src/services/messageService.js`
- `src/controllers/authController.js`
- `src/controllers/dashboardController.js`
- `src/middleware/auth.js`
- `src/config/database.js`
- `src/models/schema.sql`

### Developer B: Frontend & Integration
**Responsibilities**:
- UI design and implementation (Phase 5)
- EJS templates and views
- Frontend JavaScript
- CSS styling
- Express routes setup (Phase 6)
- App entry point (src/index.js)
- Frontend testing

**Key Files**:
- `views/login.ejs`
- `views/dashboard.ejs`
- `views/partials/*.ejs`
- `public/css/style.css`
- `public/js/dashboard.js`
- `src/routes/auth.js`
- `src/routes/dashboard.js`
- `src/routes/index.js`
- `src/index.js`

### Collaboration Points
- **Phase 1**: Setup (Day 1) - Together
- **Phase 7**: Testing (Day 10-11) - Together
- **API Contract**: Agree on endpoint signatures early
- **Daily sync**: Share progress and blockers

---

## API Contract (Integration Agreement)

### Authentication
```
POST /api/auth/login
  Body: { username: string, password: string }
  Response: { success: boolean, error?: string }

POST /api/auth/logout
  Response: { success: boolean }
```

### Messages
```
GET /api/messages
  Response: Message[]

POST /api/messages
  Body: { message_content, send_time, days_of_week, is_active }
  Response: { success: boolean, messageId: number }

PUT /api/messages/:id
  Body: { message_content?, send_time?, days_of_week?, is_active? }
  Response: { success: boolean }

DELETE /api/messages/:id
  Response: { success: boolean }

PATCH /api/messages/:id/toggle
  Response: { success: boolean, is_active: boolean }
```

### WhatsApp
```
GET /api/whatsapp/status
  Response: { connected: boolean }

GET /api/whatsapp/groups
  Response: { id: string, name: string }[]

POST /api/config/group
  Body: { groupId: string }
  Response: { success: boolean }

POST /api/whatsapp/test
  Body: { message: string }
  Response: { success: boolean }
```

### Schedule
```
GET /api/schedule/next
  Response: { messageId: number, nextRun: string }[]
```

---

## Critical Files Summary

These are the most important files that form the backbone of the application:

1. **`src/services/whatsappService.js`** - WhatsApp connection and messaging
2. **`src/services/schedulerService.js`** - Multiple cron job management
3. **`src/services/messageService.js`** - Message CRUD operations
4. **`src/index.js`** - Application entry and initialization
5. **`views/dashboard.ejs`** - Main user interface
6. **`public/js/dashboard.js`** - Frontend message management
7. **`src/controllers/dashboardController.js`** - API endpoints
8. **`src/models/schema.sql`** - Database structure

---

## Initial Setup Steps (After Implementation)

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Generate password hash: `node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"`
   - Update `ADMIN_PASSWORD_HASH` in `.env`
   - Generate random `SESSION_SECRET`

3. **First Run**:
   ```bash
   npm run dev
   ```
   - Scan QR code in terminal with WhatsApp
   - Wait for "WhatsApp client is ready!"

4. **Access Admin Panel**:
   - Go to `http://localhost:3000`
   - Login with credentials from `.env`
   - Add your first message
   - Enable it to start scheduling

---

## Key Differences from Original Plan

This plan was adjusted based on user requirements:

1. ✅ **Multiple messages** instead of single configuration
2. ✅ **No default frequency** - admin configures all schedules
3. ✅ **QR code in terminal** instead of web UI
4. ✅ **Fixed group** instead of selectable
5. ✅ **Combined Arabic + English** default message
6. ✅ **Messages table** with multiple rows instead of single config row

---

## Success Criteria

- [ ] WhatsApp connects successfully and persists session
- [ ] Can add/edit/delete multiple messages via UI
- [ ] Each message schedules independently at correct times
- [ ] Messages send only on configured days
- [ ] Admin panel is secure (login required)
- [ ] Application recovers from WhatsApp disconnections
- [ ] All data persists across restarts
- [ ] Mobile-responsive UI
- [ ] Clear documentation for setup

May this implementation be blessed and accepted. 🤲
