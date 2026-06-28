# 1-Day Work Split Plan

## Overview
Two developers building the WhatsApp bot in **ONE DAY** working in parallel.

**Timeline**: 8-10 hours total
**Strategy**: Mock first, build parallel, integrate at the end

---

## Current Status

✅ **DONE**:
- Frontend UI (login, dashboard)
- package.json with all dependencies
- Dependencies installed

❌ **TODO** (Today):
- Folder structure
- Backend services
- Routes/Server setup
- Integration

---

## Hour 0-1: Setup Together (Both Developers)

**Work together on setup (1 hour)**:

```bash
# 1. Create folder structure
mkdir -p src/{config,services,controllers,middleware,routes,models,utils}

# 2. Create .env file
cp .env.example .env

# 3. Generate admin password hash
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
# Copy hash to .env as ADMIN_PASSWORD_HASH

# 4. Create empty files
touch src/models/schema.sql
```

**Agree on API Contract** (15 mins):
- Review the API endpoints in PLAN.md
- Confirm data formats
- Agree on error responses

**Then SPLIT UP for parallel work!**

---

## Hours 1-6: Work Independently in Parallel

### Developer A: Backend (WhatsApp, Database, Services)

**Goal**: Build all backend services and APIs

#### Hour 1-2: Database & WhatsApp Setup

**Files to create**:
- `src/config/database.js` - SQLite setup
- `src/models/schema.sql` - Database schema
- `src/services/whatsappService.js` - WhatsApp client
- `src/utils/logger.js` - Winston logger

**Tasks**:
1. Create database schema (messages + app_config tables)
2. Initialize SQLite connection
3. Create WhatsApp client with QR code
4. Test: Run and scan QR code

**Test it**:
```javascript
// test.js
require('dotenv').config();
const whatsappService = require('./src/services/whatsappService');
whatsappService.initializeClient();
```

#### Hour 2-3: Message Service

**Files to create**:
- `src/services/messageService.js` - CRUD operations
- `src/utils/validation.js` - Input validation

**Tasks**:
1. getAllMessages()
2. getMessageById(id)
3. createMessage(data)
4. updateMessage(id, data)
5. deleteMessage(id)
6. toggleMessageActive(id)

**Test it**:
```javascript
const messageService = require('./src/services/messageService');
const msg = messageService.createMessage({
    message_content: 'Test',
    send_time: '14:30',
    days_of_week: '*',
    is_active: 1
});
console.log('Created:', msg);
console.log('All messages:', messageService.getAllMessages());
```

#### Hour 3-4: Scheduler Service

**Files to create**:
- `src/services/schedulerService.js` - Cron job management

**Tasks**:
1. initializeSchedules()
2. addSchedule(id, time, days, content)
3. updateSchedule(id, time, days, content)
4. removeSchedule(id)
5. Test with 1-minute interval

**Test it**:
```javascript
const schedulerService = require('./src/services/schedulerService');
schedulerService.initializeSchedules();
// Watch console for scheduled sends
```

#### Hour 4-5: Auth & Controllers

**Files to create**:
- `src/middleware/auth.js` - Auth middleware
- `src/controllers/authController.js` - Login/logout
- `src/controllers/dashboardController.js` - All API endpoints

**Tasks**:
1. Create auth middleware (check session)
2. Create login endpoint (bcrypt password check)
3. Create logout endpoint
4. Create all dashboard API endpoints:
   - GET /api/messages
   - POST /api/messages
   - PUT /api/messages/:id
   - DELETE /api/messages/:id
   - PATCH /api/messages/:id/toggle
   - GET /api/whatsapp/status
   - POST /api/whatsapp/test

#### Hour 5-6: Polish & Test

**Tasks**:
1. Add error handling to all services
2. Test each service independently
3. Document any issues
4. Commit and push code

**Deliverable**: All backend services working independently

---

### Developer B: Frontend Integration (Routes & Server)

**Goal**: Get the app running with mocks, then swap in real APIs

#### Hour 1-2: Express Server Setup

**Files to create**:
- `src/index.js` - Express app entry point
- `src/middleware/auth.js` - Basic auth middleware
- `src/config/constants.js` - App constants

**Tasks**:
1. Create Express server
2. Set up middleware (json, urlencoded, static, ejs)
3. Set up sessions
4. Create basic error handler
5. Test: Server starts on port 3000

**Basic structure**:
```javascript
// src/index.js
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
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// Routes (coming next)
const routes = require('./routes');
app.use('/', routes);

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

#### Hour 2-3: Auth Routes with MOCKS

**Files to create**:
- `src/routes/auth.js` - Auth routes
- `src/routes/index.js` - Route aggregator

**Tasks**:
1. Create login page route (GET /)
2. Create login API with MOCK auth (POST /api/auth/login)
3. Create logout API (POST /api/auth/logout)
4. Test: Can login with any credentials (mock)

**Mock login**:
```javascript
// src/routes/auth.js
router.post('/api/auth/login', (req, res) => {
    // MOCK: Accept any credentials for now
    req.session.isAuthenticated = true;
    res.json({ success: true });
});
```

#### Hour 3-4: Dashboard Routes with MOCKS

**Files to create**:
- `src/routes/dashboard.js` - All dashboard routes

**Tasks**:
1. Create dashboard page route (GET /dashboard)
2. Create MOCK API endpoints:
   - GET /api/messages - Return fake array
   - POST /api/messages - Log and return success
   - PUT /api/messages/:id - Log and return success
   - DELETE /api/messages/:id - Log and return success
   - PATCH /api/messages/:id/toggle - Log and return success
   - GET /api/whatsapp/status - Return { connected: true }
   - POST /api/whatsapp/test - Log and return success

**Mock data example**:
```javascript
// src/routes/dashboard.js
const mockMessages = [
    {
        id: 1,
        message_content: 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ\n\nPeace be upon Prophet Muhammad ﷺ',
        send_time: '12:00',
        days_of_week: '*',
        is_active: 1
    },
    {
        id: 2,
        message_content: 'Test message',
        send_time: '18:00',
        days_of_week: '1,3,5',
        is_active: 0
    }
];

router.get('/api/messages', (req, res) => {
    res.json(mockMessages);
});

router.post('/api/messages', (req, res) => {
    console.log('Mock: Would create message', req.body);
    res.json({ success: true, messageId: 3 });
});
```

#### Hour 4-5: Test UI with Mocks

**Tasks**:
1. Start server: `npm run dev`
2. Open http://localhost:3000
3. Test login flow
4. Test dashboard loads with mock messages
5. Test add/edit/delete buttons (check console logs)
6. Test all UI features
7. Fix any frontend bugs

#### Hour 5-6: Prepare for Integration

**Tasks**:
1. Create controller placeholders for easy swap
2. Document what Developer A needs to provide
3. Test error handling in UI
4. Commit and push code

**Deliverable**: Fully functional UI with mock data

---

## Hours 6-8: Integration (Both Developers)

### Hour 6-7: Swap Mocks for Real APIs

**Developer B leads, Developer A helps**:

1. **Connect Auth**:
```javascript
// src/routes/auth.js
// BEFORE
router.post('/api/auth/login', (req, res) => {
    req.session.isAuthenticated = true;
    res.json({ success: true });
});

// AFTER
const authController = require('../controllers/authController');
router.post('/api/auth/login', authController.login);
router.post('/api/auth/logout', authController.logout);
```

2. **Connect Dashboard APIs**:
```javascript
// src/routes/dashboard.js
const dashboardController = require('../controllers/dashboardController');

router.get('/api/messages', dashboardController.getMessages);
router.post('/api/messages', dashboardController.createMessage);
router.put('/api/messages/:id', dashboardController.updateMessage);
router.delete('/api/messages/:id', dashboardController.deleteMessage);
router.patch('/api/messages/:id/toggle', dashboardController.toggleMessage);
router.get('/api/whatsapp/status', dashboardController.getWhatsAppStatus);
router.post('/api/whatsapp/test', dashboardController.sendTestMessage);
```

3. **Initialize Services in src/index.js**:
```javascript
// At the bottom of src/index.js
const whatsappService = require('./services/whatsappService');
const schedulerService = require('./services/schedulerService');

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Initialize WhatsApp
    await whatsappService.initializeClient();

    // Initialize schedules
    schedulerService.initializeSchedules();
});
```

### Hour 7-8: Test Everything Together

**Checklist**:
- [ ] Server starts without errors
- [ ] WhatsApp QR code displays in console
- [ ] Scan QR code with phone
- [ ] WhatsApp shows "Connected" in UI
- [ ] Login with real credentials works
- [ ] Login with wrong credentials fails
- [ ] Dashboard loads real messages from database
- [ ] Can add a new message
- [ ] Can edit a message
- [ ] Can delete a message
- [ ] Can toggle message active/inactive
- [ ] Test message sends to WhatsApp group
- [ ] Scheduled message sends at correct time
- [ ] Session persists (refresh page, still logged in)
- [ ] Logout works

**Fix any bugs together**

---

## Hours 8-10: Polish & Deploy (Optional)

**Tasks**:
1. Fix any remaining bugs
2. Test edge cases
3. Update README.md with setup instructions
4. Create deployment guide
5. Deploy to server (if applicable)

---

## File Ownership (Avoid Conflicts)

### Developer A Creates:
```
src/config/database.js
src/config/constants.js
src/services/whatsappService.js
src/services/schedulerService.js
src/services/messageService.js
src/controllers/authController.js
src/controllers/dashboardController.js
src/middleware/auth.js (auth logic)
src/models/schema.sql
src/utils/logger.js
src/utils/validation.js
```

### Developer B Creates:
```
src/index.js
src/routes/auth.js
src/routes/dashboard.js
src/routes/index.js
```

### Shared Files (Coordinate!):
```
src/middleware/auth.js - Developer A creates, Developer B uses
src/index.js - Developer B creates, both edit during integration
```

---

## Communication During the Day

### Sync Points (Quick 5-min check-ins):

**11 AM**:
- "How's it going?"
- "Any blockers?"
- "On track?"

**2 PM**:
- "Almost done with mocks/services?"
- "Ready to integrate soon?"

**4 PM**:
- "Integration time!"
- Meet up and start connecting everything

**Continuous**:
- Use Slack/Discord for quick questions
- Share screen when stuck
- Push to git frequently

---

## Git Strategy for the Day

### Option 1: Single Branch (Simpler)
Both work on `Wajid` branch:
```bash
# Pull frequently
git pull origin Wajid

# Commit frequently
git add .
git commit -m "Add whatsapp service"
git push origin Wajid
```

### Option 2: Feature Branches (Safer)
```bash
# Developer A
git checkout -b dev-a-backend
# work, commit
git push origin dev-a-backend

# Developer B
git checkout -b dev-b-routes
# work, commit
git push origin dev-b-routes

# Later: merge both
git checkout Wajid
git merge dev-a-backend
git merge dev-b-routes
```

Use Option 1 if you trust each other, Option 2 if you want safety.

---

## Emergency Plan (If Behind Schedule)

### Must-Have Features (Priority 1):
- WhatsApp connection
- Send one manual message
- Basic login (even with hardcoded password)
- Show messages in UI

### Nice-to-Have (Priority 2):
- Scheduling (can add later)
- Full CRUD (just add for now)
- Fancy error handling

### Can Skip for Today (Priority 3):
- Test message button
- Advanced validation
- Logging
- Next execution time display

**If falling behind**: Focus on Priority 1 only!

---

## Success Criteria

By end of day, you should have:

✅ WhatsApp connected and authenticated
✅ Can send a message to the group
✅ Login page works
✅ Dashboard shows messages from database
✅ Can add at least one message
✅ Basic scheduling works (even if not perfect)
✅ No major errors

**Bonus** (if time):
✅ Full CRUD operations
✅ Scheduling with day selection
✅ WhatsApp status indicator
✅ Test message button

---

## End of Day

**Final checklist**:
1. Commit all code
2. Push to main
3. Test one more time
4. Celebrate! 🎉

**If not 100% done**: That's okay! You have:
- A working foundation
- Clear next steps
- Most features working

Can finish remaining items tomorrow.

---

## Quick Reference: Who Does What

| Task | Developer A | Developer B |
|------|-------------|-------------|
| Database setup | ✅ | - |
| WhatsApp integration | ✅ | - |
| Message CRUD | ✅ | - |
| Scheduler | ✅ | - |
| Auth logic | ✅ | - |
| API controllers | ✅ | - |
| Express server | - | ✅ |
| Routes | - | ✅ |
| Mock APIs | - | ✅ |
| UI testing | - | ✅ |
| Integration | Both together! | Both together! |
| Final testing | Both together! | Both together! |

---

May Allah bless this work and make it a means of continuous reward. 🤲
