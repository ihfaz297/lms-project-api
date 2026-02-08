const express = require('express');
const router = express.Router();
const { authenticateToken, isInstructor } = require('../middleware/auth');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ===========================================
// GET /api/instructor/courses
// Get all courses created by instructor
// ===========================================
router.get('/courses', authenticateToken, isInstructor, async (req, res) => {
  try {
    // TODO: Implement get instructor courses
    // 1. Find all courses where instructorId = req.user.id
    // 2. Return course list

    res.status(200).json({ message: 'Get instructor courses endpoint ready' });
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
    // TODO: Implement get earnings
    // 1. Find all transactions where instructorId = req.user.id
    // 2. Calculate total earnings (sum of COMPLETED transactions)
    // 3. Calculate pending earnings (sum of PENDING transactions)
    // 4. Get user balance from bank
    // 5. Return earnings breakdown

    res.status(200).json({ message: 'Get earnings endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/instructor/withdraw/:transactionId
// Instructor withdraws earnings
// Calls bank to validate and transfer funds
// ===========================================
router.post('/withdraw/:transactionId', authenticateToken, isInstructor, async (req, res) => {
  try {
    // TODO: Implement withdrawal
    // 1. Find transaction by ID
    // 2. Verify it belongs to instructor
    // 3. Call Bank API to validate and transfer
    // 4. Update transaction status
    // 5. Return confirmation

    res.status(200).json({ message: 'Withdraw endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
