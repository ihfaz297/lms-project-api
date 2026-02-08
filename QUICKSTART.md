# 🚀 Quick Start Guide (GitHub Codespaces Edition)

## Setup Instructions

### 1. Setup MongoDB

#### **Option A: MongoDB Atlas (Cloud - Recommended)**
```bash
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create free account
# 3. Create a free cluster
# 4. Get connection string: mongodb+srv://username:password@cluster.mongodb.net/lms
# 5. Copy to .env files (see step 3)

# Advantage: Works instantly, no setup needed in Codespaces
```

#### **Option B: Docker Container (Local in Codespaces)**
```bash
# Install Docker (usually already installed in Codespaces)
docker run -d -p 27017:27017 --name lms-mongo mongo:latest

# Verify:
docker ps | grep mongo

# MongoDB now running at: mongodb://localhost:27017
```

#### **Option C: MongoDB Community Server**
```bash
# Ubuntu (Codespaces base image)
sudo apt-get update
sudo apt-get install -y mongodb

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify (may need sudo)
sudo systemctl status mongodb
```

**Recommendation: Use Option A (Atlas) - fastest setup** ✨

### 2. Install Dependencies

```bash
# LMS Backend
cd /workspaces/lms-project-api/lms-backend
npm install

# Bank API (in new terminal)
cd /workspaces/lms-project-api/bank-api
npm install

# Frontend (already done)
cd /workspaces/lms-project-api/lms-frontend
npm install
```

### 3. Setup Environment Variables

```bash
# Navigate to lms-backend
cd /workspaces/lms-project-api/lms-backend
cp .env.example .env
# Edit .env and add MongoDB URI:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lms
# OR: MONGODB_URI=mongodb://localhost:27017/lms (if using Docker/local)

# Same for bank-api
cd /workspaces/lms-project-api/bank-api
cp .env.example .env
# Edit .env and add same MONGODB_URI
```

### 4. Start All Services

```bash
# Terminal 1: Bank API
cd /workspaces/lms-project-api/bank-api
npm run dev

# Terminal 2: LMS Backend (new terminal - Ctrl+Shift+`)
cd /workspaces/lms-project-api/lms-backend
npm run dev

# Terminal 3: Frontend (new terminal)
cd /workspaces/lms-project-api/lms-frontend
npm run dev

# All services now running:
# Bank API:     http://localhost:3002
# LMS Backend:  http://localhost:3001
# Frontend:     http://localhost:5173

# ✨ Codespaces auto-exposes these ports as public URLs
# Check "Ports" tab in Codespaces to see live URLs
```

### 5. Access Your Services

In Codespaces:
1. Open the **Ports** tab (bottom of screen)
2. You'll see:
   - `3001` (LMS Backend) → Click to open in browser
   - `3002` (Bank API) → Click to open in browser  
   - `5173` (Frontend) → Click to open in browser
3. Or use the auto-generated URLs like: `https://codespace-xxxx-3001.preview.app.github.dev`

---

## 📝 What You Need to Implement

### Priority 1: Bank API (Start here - simplest)

#### `bank-api/routes/accounts.js`
```javascript
// 1. POST /api/accounts/setup
   - Validate accountNumber (min 10 chars) and secret (min 6 chars)
   - Create BankAccount with $10,000 initial balance
   - Return { accountNumber, balance }

// 2. GET /api/accounts/:accountNumber/balance
   - Verify secret from query params
   - Return { balance, accountNumber }
```

#### `bank-api/routes/transactions.js`
```javascript
// 1. POST /api/transactions/transfer
   - Verify fromAccount exists and secret matches
   - Check balance >= amount
   - Deduct from fromAccount
   - Add to toAccount
   - Create BankTransaction record
   - Return { transactionId, status: "completed" }

// 2. GET /api/transactions/:transactionId
   - Find and return transaction details

// 3. POST /api/transactions/:transactionId/validate
   - Find transaction
   - Verify status is "completed"
   - Return { status: "validated", confirmed: true }
```

---

### Priority 2: LMS Auth

#### `lms-backend/routes/auth.js`
```javascript
// 1. POST /api/auth/register
   - Validate name, email, password, role
   - Check email not already registered
   - Create User with hashed password
   - Generate JWT token: jwt.encode({ id, email, role }, JWT_SECRET)
   - Return { token, user: { id, name, email, role } }

// 2. POST /api/auth/login
   - Find user by email
   - Compare password with user.comparePassword()
   - Generate JWT token
   - Return { token, user }

// 3. GET /api/auth/profile
   - Use req.user from authenticateToken middleware
   - Find and return user (no password)
```

---

### Priority 3: Courses

#### `lms-backend/routes/courses.js`
```javascript
// 1. GET /api/courses
   - Find all courses
   - Return array of courses

// 2. GET /api/courses/:id
   - Find course by ID
   - Return course details

// 3. POST /api/courses (Instructor only)
   - Create course with instructorId = req.user.id
   - Save to DB
   - Return created course

// 4. GET /api/courses/:id/materials
   - Find CourseMaterial records for courseId
   - Sort by order
   - Return array

// 5. POST /api/courses/:id/materials (Instructor only)
   - Create CourseMaterial
   - Validate course belongs to instructor
   - Save to DB
   - Return created material

// 6. POST /api/courses/:id/enroll (Learner only)
   - ⭐ THIS IS THE CRITICAL FLOW ⭐
   - Check if learner already enrolled
   - Find course and get price
   - Call Bank API: POST /api/transactions/transfer
     - from: learner bank account
     - to: lms_org bank account
     - amount: course.price
   - If successful:
     - Create Enrollment record
     - Create Transaction record (status: PENDING)
     - Return success message
   - If failed: return error

// 7. POST /api/courses/:id/complete (Learner only)
   - Find enrollment
   - Update: completed = true
   - Create Certificate
   - Return certificate
```

---

### Priority 4: Bank Integration

#### `lms-backend/routes/bank.js`
```javascript
// 1. POST /api/bank/setup
   - Get user from req.user
   - Call Bank API: POST /api/accounts/setup
     - accountNumber, secret, userId, type: "learner" or "instructor"
   - Update User: bankAccount, bankSecret, hasBankSetup = true
   - Return success

// 2. GET /api/bank/balance
   - Get user bank account and secret
   - Call Bank API: GET /api/accounts/:accountNumber/balance?secret=...
   - Return balance

// 3. POST /api/bank/transactions/:id/validate
   - Find transaction record
   - Call Bank API: POST /api/transactions/:id/validate
   - If validated:
     - Update transaction status to COMPLETED
     - Update enrollment to active
     - Return success
```

---

### Priority 5: Instructor Features

#### `lms-backend/routes/instructor.js`
```javascript
// 1. GET /api/instructor/courses
   - Find courses where instructorId = req.user.id
   - Return course array

// 2. GET /api/instructor/earnings
   - Find all transactions where instructorId = req.user.id
   - Calculate total (sum COMPLETED)
   - Calculate pending (sum PENDING)
   - Get bank balance via Bank API
   - Return { total, pending, balance }

// 3. POST /api/instructor/withdraw/:transactionId
   - Find transaction
   - Verify instructor owns it
   - Call Bank API to validate: POST /api/transactions/:id/validate
   - If success: update transaction to COMPLETED
   - Return confirmation
```

---

## 🧪 Testing with Curl (Codespaces)

### Get Your Service URLs

In Codespaces, ports are forwarded with special URLs. Use one of these approaches:

**Option 1: Use localhost (easiest)**
```bash
# While developing in Codespaces, localhost still works:
curl http://localhost:3002/api/accounts/setup
```

**Option 2: Use Codespaces public URL (for testing from other devices)**
```bash
# From Ports tab, get the URL like:
# https://codespace-name-3002.preview.app.github.dev

curl https://codespace-name-3002.preview.app.github.dev/api/accounts/setup
```

### Test Bank API First

```bash
# 1. Create LMS Org account
curl -X POST http://localhost:3002/api/accounts/setup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "LMS0000001",
    "secret": "lms_secret_123",
    "type": "lms_org"
  }'

# 2. Create Learner account
curl -X POST http://localhost:3002/api/accounts/setup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "LEARNER000001",
    "secret": "learner_secret_123",
    "type": "learner",
    "userId": "user_123"
  }'

# 3. Check balance
curl http://localhost:3002/api/accounts/LEARNER000001/balance?secret=learner_secret_123

# 4. Transfer money
curl -X POST http://localhost:3002/api/transactions/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "LEARNER000001",
    "toAccount": "LMS0000001",
    "amount": 49.99,
    "secret": "learner_secret_123",
    "reason": "course_enrollment"
  }'

# Response includes: transactionId
# 5. Validate transaction
curl -X POST http://localhost:3002/api/transactions/TRANSACTION_ID/validate
```

### Test LMS Auth

```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Learner",
    "email": "john@example.com",
    "password": "password123",
    "role": "learner"
  }'

# Response includes: token
# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# 3. Get profile (use token from login)
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Database Schema Reference

### MongoDB Collections

```
users {
  name, email, password (hashed), role, 
  bankAccount, bankSecret, hasBankSetup, createdAt
}

courses {
  title, description, price, instructorId, instructorName,
  thumbnail, duration, level, createdAt
}

courseMaterials {
  courseId, title, type (video|text|audio|mcq),
  content, order, createdAt
}

enrollments {
  learnerId, courseId, progress (0-100),
  completed, enrolledAt, completedAt
}

transactions {
  learnerId, courseId, instructorId, amount,
  type (payment|payout), status (pending|validated|completed),
  bankTransactionId, createdAt, completedAt
}

certificates {
  learnerId, courseId, courseName, userName, issuedAt
}
```

---

## 🎯 Milestone Checklist

- [ ] Bank API accounts endpoint working
- [ ] Bank API transfers working
- [ ] LMS auth register/login working
- [ ] LMS can fetch courses from DB
- [ ] Learner can enroll (triggers bank transfer)
- [ ] Instructor can see pending earnings
- [ ] Instructor can validate transaction (gets paid)
- [ ] Course unlocks for learner after validation
- [ ] Learner can complete course and get certificate

---

## 🆘 Codespaces Troubleshooting

### MongoDB Connection Issues
```bash
# If you get "MongoNetworkError" or "ECONNREFUSED":

# 1. Check if using Docker (if yes, verify container is running):
docker ps

# 2. If using Atlas, check connection string format:
# Should be: mongodb+srv://user:pass@cluster.mongodb.net/lms

# 3. Test MongoDB connection:
npm install -g mongodb
mongosh "mongodb://localhost:27017" (or your Atlas URI)

# 4. Common fixes:
# - Make sure .env file has correct MONGODB_URI
# - If using Docker: docker run -d -p 27017:27017 mongo:latest
# - If using Atlas: Whitelist 0.0.0.0/0 in IP Access List
```

### Port Already in Use
```bash
# If port 3001, 3002, or 5173 is already in use:

# Find process using port:
lsof -i :3001
lsof -i :3002
lsof -i :5173

# Kill process:
kill -9 <PID>

# Or change port in .env:
PORT=3003  (instead of 3001)
```

### Frontend Can't Connect to Backend
```bash
# If frontend shows "Cannot reach backend":

# 1. Make sure all services are running
# 2. Check Backend URL in frontend code (should be localhost:3001)
# 3. Verify CORS is enabled in lms-backend/server.js
# 4. In Ports tab, right-click port 3001 → "Make public" (if needed)
```

### Codespaces Port Forwarding
```bash
# Ports are automatically forwarded, but to make them public:
# 1. Bottom left: Click "Ports"
# 2. Right-click port number
# 3. Select "Make public"
# 4. Copy the URL and use that instead of localhost

# Or use localhost:PORT while in Codespaces editor
```

---

Good luck! Hit me up if you get stuck. 💪

