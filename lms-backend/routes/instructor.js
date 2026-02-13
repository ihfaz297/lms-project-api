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
// GET /api/instructor/courses
// Get all courses created by instructor
// ===========================================
router.get('/courses', authenticateToken, isInstructor, async (req, res) => {
  try {
    // TODO: Implement get instructor courses
    // 1. Find all courses where instructor = req.user.id
    const courses = await Course.find({ instructor: req.user.id });
    // 2. Return course list
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
    // TODO: Implement get earnings
    // 1. Find all transactions where instructorId = req.user.id
    const transactions = await Transaction.find({
      instructorId: req.user.id,
      type: 'payment'
    });

    // 2. Calculate total earnings (sum of COMPLETED transactions)
    const completedEarnings = transactions.filter(tx => tx.status === 'completed' || tx.status === 'validated').reduce((sum, tx) => sum + tx.amount, 0);
    // 3. Calculate pending earnings (sum of PENDING transactions)
    const pendingEarnings = transactions.filter(tx => tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0);

    // 3. Get pending transactions list
    const pendingTransactions = transactions.filter(tx => tx.status === 'pending');

    // 4. Get user balance from bank
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

    // 5. Return earnings breakdown

    // Enrich transactions with course names
    const courseIds = [...new Set(transactions.map(tx => tx.courseId.toString()))];
    const courses = await Course.find({ _id: { $in: courseIds } });
    const courseMap = new Map(courses.map(c => [c._id.toString(), c.title]));

    const enrichedTransactions = transactions.map(tx => ({
      ...tx.toJSON(),
      courseName: courseMap.get(tx.courseId.toString()) || 'Unknown Course',
    }));

    res.status(200).json({ 
      total: completedEarnings,
      pending: pendingEarnings,
      transactions: enrichedTransactions,
      bankBalance
     });
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
    const { transactionId } = req.params;
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
      { isPaid: true, progress: 0 } // Enrollment is now active
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
