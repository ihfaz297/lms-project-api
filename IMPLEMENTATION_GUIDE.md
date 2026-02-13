# LMS Backend Implementation Guide

This guide contains **exact code** to complete all TODO items in `lms-backend`. Copy-paste directly.

---

## Prerequisites

### 1. Update `.env` file

Add these lines to `lms-backend/.env`:

```dotenv
MONGODB_URI=mongodb://localhost:27017/lms
PORT=3001
JWT_SECRET=your_super_secret_jwt_key_change_this
BANK_API_URL=http://localhost:3002/api

# LMS Organization Bank Account (for receiving payments and paying instructors)
LMS_BANK_ACCOUNT=lms_org_account_001
LMS_BANK_SECRET=lms_secret_123

# Instructor payout amounts
COURSE_UPLOAD_BONUS=100
MATERIAL_UPLOAD_BONUS=50
```

### 2. Setup LMS Org Bank Account

Before testing, you need to create the LMS org account in the Bank API. Run this after starting bank-api:

```bash
curl -X POST http://localhost:3002/api/accounts/setup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "lms_org_account_001",
    "secret": "lms_secret_123",
    "userId": "lms_organization",
    "type": "lms_org"
  }'
```

---

## File 1: `lms-backend/routes/bank.js` (COMPLETE REPLACEMENT)

Replace the entire file with:

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:3002/api';

// ===========================================
// POST /api/bank/setup
// Setup bank account for user
// ===========================================
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { accountNumber, secret } = req.body;

    // 1. Validate accountNumber and secret
    if (!accountNumber || accountNumber.length < 10) {
      return res.status(400).json({ error: 'Account number must be at least 10 characters' });
    }
    if (!secret || secret.length < 6) {
      return res.status(400).json({ error: 'Secret must be at least 6 characters' });
    }

    // 2. Call Bank API to verify/create account
    const bankResponse = await axios.post(`${BANK_API_URL}/accounts/setup`, {
      accountNumber,
      secret,
      userId: req.user.id,
      type: req.user.role // 'learner' or 'instructor'
    });

    // 3. Store accountNumber and secret in user document
    const user = await User.findById(req.user.id);
    user.bankAccount = accountNumber;
    user.bankSecret = secret;
    user.hasBankSetup = true;
    await user.save();

    // 4. Return success message with account info
    res.status(200).json({
      message: 'Bank account setup successful',
      account: bankResponse.data.account
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/bank/balance
// Get user balance from bank
// ===========================================
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    // 1. Get user bank account from DB
    const user = await User.findById(req.user.id);
    if (!user.hasBankSetup) {
      return res.status(400).json({ error: 'Bank account not setup' });
    }

    // 2. Call Bank API to get balance
    const bankResponse = await axios.get(
      `${BANK_API_URL}/accounts/${user.bankAccount}/balance?secret=${user.bankSecret}`
    );

    // 3. Return balance
    res.status(200).json({
      accountNumber: bankResponse.data.accountNumber,
      balance: bankResponse.data.balance,
      type: bankResponse.data.type
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/bank/pay
// Process payment for course enrollment
// (Alternative to direct enrollment - can be used for manual payments)
// ===========================================
router.post('/pay', authenticateToken, async (req, res) => {
  try {
    const { courseId, amount } = req.body;

    // 1. Get user bank details
    const user = await User.findById(req.user.id);
    if (!user.hasBankSetup) {
      return res.status(400).json({ error: 'Bank account not setup' });
    }

    // 2. Call Bank API to process payment (learner -> LMS org)
    const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
      fromAccount: user.bankAccount,
      toAccount: process.env.LMS_BANK_ACCOUNT,
      amount: amount,
      secret: user.bankSecret,
      reason: `course_payment_${courseId}`
    });

    // 3. Return transaction confirmation
    res.status(200).json({
      message: 'Payment processed successfully',
      transactionId: bankResponse.data.transactionId
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/bank/transactions/:transactionId/validate
// Instructor validates transaction with bank
// This is when money gets transferred to instructor account
// ===========================================
router.post('/transactions/:transactionId/validate', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // 1. Call Bank API to validate transaction
    const bankResponse = await axios.post(
      `${BANK_API_URL}/transactions/${transactionId}/validate`
    );

    // 2. Return confirmation
    res.status(200).json({
      message: 'Transaction validated successfully',
      validation: bankResponse.data
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## File 2: `lms-backend/routes/courses.js` (COMPLETE REPLACEMENT)

Replace the entire file with:

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, isLearner, isInstructor } = require('../middleware/auth');
const Course = require('../models/Course');
const CourseMaterial = require('../models/CourseMaterial');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const axios = require('axios');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:3002/api';
const COURSE_UPLOAD_BONUS = Number(process.env.COURSE_UPLOAD_BONUS) || 100;
const MATERIAL_UPLOAD_BONUS = Number(process.env.MATERIAL_UPLOAD_BONUS) || 50;

// ===========================================
// GET /api/courses
// Get all courses (max 5 as per requirements)
// ===========================================
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().limit(5).populate('instructor', 'name email');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/courses/:id
// Get single course details
// ===========================================
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses
// Create new course (instructor only)
// Pays instructor a lump sum bonus
// ===========================================
router.post('/', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { title, description, price, duration, level, thumbnail } = req.body;

    // 1. Validate input
    if (!title || !description || price === undefined || !duration || !level || !thumbnail) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (price < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    // 2. Check course limit (max 5 courses in system)
    const courseCount = await Course.countDocuments();
    if (courseCount >= 5) {
      return res.status(400).json({ error: 'Maximum course limit (5) reached.' });
    }

    // 3. Get instructor with bank details
    const instructor = await User.findById(req.user.id);
    if (!instructor.hasBankSetup) {
      return res.status(400).json({ error: 'Please setup your bank account first.' });
    }

    // 4. Create course
    const newCourse = new Course({
      title,
      description,
      price,
      duration,
      level,
      thumbnail,
      instructor: req.user.id
    });
    await newCourse.save();

    // 5. Pay instructor lump sum via Bank API (LMS org -> Instructor)
    let payoutTransaction = null;
    try {
      const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: process.env.LMS_BANK_ACCOUNT,
        toAccount: instructor.bankAccount,
        amount: COURSE_UPLOAD_BONUS,
        secret: process.env.LMS_BANK_SECRET,
        reason: 'course_upload_bonus'
      });

      // 6. Record payout transaction in LMS
      payoutTransaction = new Transaction({
        learnerId: req.user.id, // Using instructor as "learner" for payout records
        courseId: newCourse._id,
        instructorId: req.user.id,
        amount: COURSE_UPLOAD_BONUS,
        type: 'payout',
        status: 'completed',
        bankTransactionId: bankResponse.data.transactionId,
        completedAt: new Date()
      });
      await payoutTransaction.save();
    } catch (bankError) {
      // Bank transfer failed - course still created but payout failed
      console.error('Instructor payout failed:', bankError.response?.data || bankError.message);
      // Optionally: delete the course if payout is mandatory
      // await Course.findByIdAndDelete(newCourse._id);
      // return res.status(502).json({ error: 'Course created but payout failed' });
    }

    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse,
      payout: payoutTransaction ? {
        amount: COURSE_UPLOAD_BONUS,
        status: 'completed'
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/courses/:id/materials
// Get course materials
// ===========================================
router.get('/:id/materials', async (req, res) => {
  try {
    // 1. Find materials for course ID
    const materials = await CourseMaterial.find({ courseId: req.params.id })
      .sort({ order: 1 });

    // 2. Return materials sorted by order
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses/:id/materials
// Add material to course (instructor only)
// Pays instructor a lump sum bonus
// ===========================================
router.post('/:id/materials', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { title, type, content, order } = req.body;
    const courseId = req.params.id;

    // 1. Validate course exists and belongs to instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add materials to this course' });
    }

    // 2. Validate input
    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }
    if (!['video', 'text', 'audio', 'mcq'].includes(type)) {
      return res.status(400).json({ error: 'Invalid material type' });
    }

    // 3. Get instructor bank details
    const instructor = await User.findById(req.user.id);
    if (!instructor.hasBankSetup) {
      return res.status(400).json({ error: 'Please setup your bank account first.' });
    }

    // 4. Create material
    const material = new CourseMaterial({
      courseId,
      title,
      type,
      content,
      order: order || 0
    });
    await material.save();

    // 5. Pay instructor lump sum via Bank API
    let payoutTransaction = null;
    try {
      const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: process.env.LMS_BANK_ACCOUNT,
        toAccount: instructor.bankAccount,
        amount: MATERIAL_UPLOAD_BONUS,
        secret: process.env.LMS_BANK_SECRET,
        reason: 'material_upload_bonus'
      });

      payoutTransaction = new Transaction({
        learnerId: req.user.id,
        courseId: courseId,
        instructorId: req.user.id,
        amount: MATERIAL_UPLOAD_BONUS,
        type: 'payout',
        status: 'completed',
        bankTransactionId: bankResponse.data.transactionId,
        completedAt: new Date()
      });
      await payoutTransaction.save();
    } catch (bankError) {
      console.error('Material payout failed:', bankError.response?.data || bankError.message);
    }

    res.status(201).json({
      message: 'Material added successfully',
      material,
      payout: payoutTransaction ? {
        amount: MATERIAL_UPLOAD_BONUS,
        status: 'completed'
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses/:id/enroll
// Enroll learner in course (learner only)
// CRITICAL: This triggers the payment flow
// ===========================================
router.post('/:id/enroll', authenticateToken, isLearner, async (req, res) => {
  try {
    const courseId = req.params.id;
    const learnerId = req.user.id;

    // 1. Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 2. Check if learner already enrolled
    const existingEnrollment = await Enrollment.findOne({ learnerId, courseId });
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // 3. Get learner bank details
    const learner = await User.findById(learnerId);
    if (!learner.hasBankSetup) {
      return res.status(400).json({ error: 'Please setup your bank account first.' });
    }

    // 4. Call Bank API to process payment (learner -> LMS org)
    let bankTransactionId;
    try {
      const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: learner.bankAccount,
        toAccount: process.env.LMS_BANK_ACCOUNT,
        amount: course.price,
        secret: learner.bankSecret,
        reason: 'course_enrollment'
      });
      bankTransactionId = bankResponse.data.transactionId;
    } catch (bankError) {
      const errorMsg = bankError.response?.data?.error || 'Payment failed';
      return res.status(402).json({ error: errorMsg });
    }

    // 5. Create enrollment record (status pending until instructor validates)
    const enrollment = new Enrollment({
      learnerId,
      courseId,
      progress: 0,
      completed: false
    });
    await enrollment.save();

    // 6. Create transaction record (status: PENDING - awaiting instructor validation)
    const transaction = new Transaction({
      learnerId,
      courseId,
      instructorId: course.instructor,
      amount: course.price,
      type: 'payment',
      status: 'pending',
      bankTransactionId
    });
    await transaction.save();

    res.status(201).json({
      message: 'Enrolled successfully! Payment processed.',
      enrollment,
      transactionId: transaction._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/courses/:id/complete
// Mark course as completed (learner only)
// ===========================================
router.post('/:id/complete', authenticateToken, isLearner, async (req, res) => {
  try {
    const courseId = req.params.id;
    const learnerId = req.user.id;

    // 1. Find enrollment
    const enrollment = await Enrollment.findOne({ learnerId, courseId });
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    if (enrollment.completed) {
      return res.status(400).json({ error: 'Course already completed' });
    }

    // 2. Get course and user info for certificate
    const course = await Course.findById(courseId);
    const learner = await User.findById(learnerId);

    // 3. Mark as completed
    enrollment.completed = true;
    enrollment.progress = 100;
    enrollment.completedAt = new Date();
    await enrollment.save();

    // 4. Create certificate
    const certificate = new Certificate({
      learnerId,
      courseId,
      courseName: course.title,
      userName: learner.name
    });
    await certificate.save();

    // 5. Return certificate
    res.status(200).json({
      message: 'Congratulations! Course completed.',
      certificate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## File 3: `lms-backend/routes/instructor.js` (COMPLETE REPLACEMENT)

Replace the entire file with:

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken, isInstructor } = require('../middleware/auth');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const axios = require('axios');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:3002/api';

// ===========================================
// GET /api/instructor/courses
// Get all courses created by instructor
// ===========================================
router.get('/courses', authenticateToken, isInstructor, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/instructor/earnings
// Get instructor earnings and pending transactions
// ===========================================
router.get('/earnings', authenticateToken, isInstructor, async (req, res) => {
  try {
    // 1. Find all payment transactions where instructorId = req.user.id
    const transactions = await Transaction.find({
      instructorId: req.user.id,
      type: 'payment'
    });

    // 2. Calculate totals
    const totalEarnings = transactions
      .filter(t => t.status === 'completed' || t.status === 'validated')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingEarnings = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Get pending transactions list
    const pendingTransactions = transactions.filter(t => t.status === 'pending');

    // 4. Get bank balance if available
    let bankBalance = null;
    const user = await User.findById(req.user.id);
    if (user.hasBankSetup) {
      try {
        const bankResponse = await axios.get(
          `${BANK_API_URL}/accounts/${user.bankAccount}/balance?secret=${user.bankSecret}`
        );
        bankBalance = bankResponse.data.balance;
      } catch (err) {
        console.error('Failed to fetch bank balance:', err.message);
      }
    }

    res.status(200).json({
      totalEarnings,
      pendingEarnings,
      bankBalance,
      pendingTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/instructor/withdraw/:transactionId
// Instructor validates transaction and receives payout
// Money transfers from LMS org -> Instructor
// ===========================================
router.post('/withdraw/:transactionId', authenticateToken, isInstructor, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // 1. Find transaction by ID
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // 2. Verify it belongs to instructor
    if (transaction.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 3. Check transaction is pending
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: `Transaction already ${transaction.status}` });
    }

    // 4. Validate with Bank API that original payment was completed
    try {
      await axios.post(`${BANK_API_URL}/transactions/${transaction.bankTransactionId}/validate`);
    } catch (bankError) {
      return res.status(400).json({ error: 'Bank transaction not valid or not completed' });
    }

    // 5. Transfer money from LMS org to instructor
    const instructor = await User.findById(req.user.id);
    if (!instructor.hasBankSetup) {
      return res.status(400).json({ error: 'Instructor bank account not setup' });
    }

    try {
      await axios.post(`${BANK_API_URL}/transactions/transfer`, {
        fromAccount: process.env.LMS_BANK_ACCOUNT,
        toAccount: instructor.bankAccount,
        amount: transaction.amount,
        secret: process.env.LMS_BANK_SECRET,
        reason: 'instructor_payout'
      });
    } catch (bankError) {
      return res.status(502).json({ 
        error: 'Failed to transfer funds to instructor',
        details: bankError.response?.data?.error 
      });
    }

    // 6. Update transaction status to validated
    transaction.status = 'validated';
    transaction.completedAt = new Date();
    await transaction.save();

    // 7. Update enrollment to active (learner can now access course)
    await Enrollment.findOneAndUpdate(
      { learnerId: transaction.learnerId, courseId: transaction.courseId },
      { progress: 0 } // Enrollment is now active
    );

    res.status(200).json({
      message: 'Withdrawal successful! Funds transferred to your account.',
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## Testing Checklist

### Start Services

```bash
# Terminal 1: Start MongoDB (if not running)
mongod

# Terminal 2: Start Bank API
cd bank-api
npm install
npm start
# Running on http://localhost:3002

# Terminal 3: Start LMS Backend
cd lms-backend
npm install
npm start
# Running on http://localhost:3001
```

### Test Sequence

#### 1. Setup LMS Org Bank Account
```bash
curl -X POST http://localhost:3002/api/accounts/setup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "lms_org_account_001",
    "secret": "lms_secret_123",
    "userId": "lms_organization",
    "type": "lms_org"
  }'
```

#### 2. Register Instructor
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Instructor",
    "email": "instructor@test.com",
    "password": "password123",
    "role": "instructor"
  }'
# Save the token!YOUR_INSTRUCTOR_ID "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyM2YyZWYwZDM0MjIwY2E1YzAyMSIsIm5hbWUiOiJKb2huIEluc3RydWN0b3IiLCJlbWFpbCI6Imluc3RydWN0b3JAdGVzdC5jb20iLCJyb2xlIjoiaW5zdHJ1Y3RvciJ9.tGHSyT4Nka_SSmEyfGgPkky6p2juMPzjG25jw1yLEk8"

```

#### 3. Setup Instructor Bank
```bash
curl -X POST http://localhost:3001/api/bank/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyM2YyZWYwZDM0MjIwY2E1YzAyMSIsIm5hbWUiOiJKb2huIEluc3RydWN0b3IiLCJlbWFpbCI6Imluc3RydWN0b3JAdGVzdC5jb20iLCJyb2xlIjoiaW5zdHJ1Y3RvciJ9.tGHSyT4Nka_SSmEyfGgPkky6p2juMPzjG25jw1yLEk8" \
  -d '{
    "accountNumber": "instructor_account_001",
    "secret": "secret123"
  }'
```

#### 4. Create Course (Should Trigger Payout)
```bash
curl -X POST http://localhost:3001/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyM2YyZWYwZDM0MjIwY2E1YzAyMSIsIm5hbWUiOiJKb2huIEluc3RydWN0b3IiLCJlbWFpbCI6Imluc3RydWN0b3JAdGVzdC5jb20iLCJyb2xlIjoiaW5zdHJ1Y3RvciJ9.tGHSyT4Nka_SSmEyfGgPkky6p2juMPzjG25jw1yLEk8" \
  -d '{
    "title": "Learn Node.js",
    "description": "Complete Node.js course",
    "price": 99.99,
    "duration": "10 hours",
    "level": "beginner",
    "thumbnail": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9FmpaTj_gBxqgnvYMGiR3A9PcmeEw3OphNA&s"
  }'
# Check: instructor bank balance should increase by 100
```

#### 5. Add Course Material (Should Trigger Payout)
```bash
curl -X POST http://localhost:3001/api/courses/698f27ceef0d34220ca5c027/materials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyM2YyZWYwZDM0MjIwY2E1YzAyMSIsIm5hbWUiOiJKb2huIEluc3RydWN0b3IiLCJlbWFpbCI6Imluc3RydWN0b3JAdGVzdC5jb20iLCJyb2xlIjoiaW5zdHJ1Y3RvciJ9.tGHSyT4Nka_SSmEyfGgPkky6p2juMPzjG25jw1yLEk8" \
  -d '{
    "title": "Introduction Video",
    "type": "video",
    "content": "https://www.youtube.com/watch?v=Ec08db2hP10&list=RDEc08db2hP10&start_radio=1",
    "order": 1
  }'
# Check: instructor bank balance should increase by 50
```

#### 6. Register Learner
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Learner",
    "email": "learner@test.com",
    "password": "password123",
    "role": "learner"
  }'
# Save the token! "YOUR_LEARNER_ID eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyOTQ1ZWYwZDM0MjIwY2E1YzAzMiIsIm5hbWUiOiJKYW5lIExlYXJuZXIiLCJlbWFpbCI6ImxlYXJuZXJAdGVzdC5jb20iLCJyb2xlIjoibGVhcm5lciJ9.WD5f9gAruiQKO6aRQhUfCetwMLBRDGQXOOJCKJuIwfA"
```

#### 7. Setup Learner Bank
```bash
curl -X POST http://localhost:3001/api/bank/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyOTQ1ZWYwZDM0MjIwY2E1YzAzMiIsIm5hbWUiOiJKYW5lIExlYXJuZXIiLCJlbWFpbCI6ImxlYXJuZXJAdGVzdC5jb20iLCJyb2xlIjoibGVhcm5lciJ9.WD5f9gAruiQKO6aRQhUfCetwMLBRDGQXOOJCKJuIwfA" \
  -d '{
    "accountNumber": "learner_account_001",
    "secret": "secret123"
  }'
```

#### 8. Enroll in Course
```bash
curl -X POST http://localhost:3001/api/courses/698f27ceef0d34220ca5c027/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyOTQ1ZWYwZDM0MjIwY2E1YzAzMiIsIm5hbWUiOiJKYW5lIExlYXJuZXIiLCJlbWFpbCI6ImxlYXJuZXJAdGVzdC5jb20iLCJyb2xlIjoibGVhcm5lciJ9.WD5f9gAruiQKO6aRQhUfCetwMLBRDGQXOOJCKJuIwfA"
# Save the transactionId from response! 698f2a11ef0d34220ca5c03b
```

#### 9. Instructor Withdraws Earnings
```bash
curl -X POST http://localhost:3001/api/instructor/withdraw/698f2a11ef0d34220ca5c03b \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyM2YyZWYwZDM0MjIwY2E1YzAyMSIsIm5hbWUiOiJKb2huIEluc3RydWN0b3IiLCJlbWFpbCI6Imluc3RydWN0b3JAdGVzdC5jb20iLCJyb2xlIjoiaW5zdHJ1Y3RvciJ9.tGHSyT4Nka_SSmEyfGgPkky6p2juMPzjG25jw1yLEk8"
```{at this point, student receives isPaid status}

#### 10. Complete Course
```bash
curl -X POST http://localhost:3001/api/courses/698f27ceef0d34220ca5c027/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY5OGYyOTQ1ZWYwZDM0MjIwY2E1YzAzMiIsIm5hbWUiOiJKYW5lIExlYXJuZXIiLCJlbWFpbCI6ImxlYXJuZXJAdGVzdC5jb20iLCJyb2xlIjoibGVhcm5lciJ9.WD5f9gAruiQKO6aRQhUfCetwMLBRDGQXOOJCKJuIwfA"
# Should return certificate!
```

#### 11. Check Balances
```bash
# Learner balance (should be 10000 - 99.99)
curl http://localhost:3001/api/bank/balance \
  -H "Authorization: Bearer YOUR_LEARNER_TOKEN"

# Instructor balance (should be 10000 + 100 + 50 + 99.99)
curl http://localhost:3001/api/bank/balance \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN"

# LMS Org balance (should be 10000 - 100 - 50 + 99.99 - 99.99)
curl "http://localhost:3002/api/accounts/lms_org_account_001/balance?secret=lms_secret_123"
```

---

## Summary: What Each Flow Does

| Action | Bank Transfer | Direction |
|--------|--------------|-----------|
| Create Course | $100 | LMS Org → Instructor |
| Add Material | $50 | LMS Org → Instructor |
| Enroll in Course | Course Price | Learner → LMS Org |
| Instructor Withdraw | Course Price | LMS Org → Instructor |

---

## Files Changed Summary

1. `.env` - Add LMS bank credentials and bonus amounts
2. `routes/bank.js` - Complete implementation
3. `routes/courses.js` - Complete implementation with bank integration
4. `routes/instructor.js` - Complete implementation with withdraw flow

That's it! Copy-paste the code blocks above and you're done.
