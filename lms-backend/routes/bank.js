const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const BANK_API_URL = process.env.BANK_API_URL || 'http://localhost:3002/api';

// ===========================================
// POST /api/bank/setup
// Setup bank account for user
// ===========================================
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { accountNumber, secret } = req.body;

    // TODO: Implement bank setup
    // 1. Validate accountNumber and secret
    if(!accountNumber || accountNumber.length < 10 || !secret || secret.length < 6) {
      return res.status(400).json({error: 'accountNumber and secret are required'});
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
    
    // 4. Set hasBankSetup to true
    user.hasBankSetup = true;
    await user.save();
    // 5. Return success message

    res.status(200).json({
      message: 'Bank account setup successful',
      account: bankResponse.data.account
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/bank/balance
// Get user balance from bank
// ===========================================
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    // TODO: Implement get balance
    // 1. Get user bank account from DB
    const user = await User.findById(req.user.id);
    if(!user.hasBankSetup) {
      return res.status(400).json({error: 'Please setup your bank account first.'});
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
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/bank/pay
// Process payment for course enrollment
// ===========================================
router.post('/pay', authenticateToken, async (req, res) => {
  try {
    const { courseId, amount } = req.body;

    // TODO: Implement payment processing
    // 1. Get user bank details
    const user = await User.findById(req.user.id);
    if(!user.hasBankSetup) {
      return res.status(400).json({error: 'Please setup your bank account first.'});
    }
    // 2. Call Bank API to process payment (learner -> LMS org)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const bankResponse = await axios.post(`${BANK_API_URL}/transactions/transfer`, {
      fromAccount: user.bankAccount,
      toAccount: process.env.LMS_BANK_ACCOUNT,
      amount: amount,
      secret: user.bankSecret,
      reason: `course_payment_${courseId}`
    });

    // 3. Store transaction record in DB
    const transaction = new Transaction({
      learnerId: req.user.id,   // Correct field name
      courseId,
      instructorId: course.instructor,
      amount,
      type: 'payment',          // lowercase
      status: 'pending',        // lowercase
      bankTransactionId: bankResponse.data.transactionId
    });
    await transaction.save();
    // 4. Return transaction confirmation
    res.status(200).json({
      message: 'Payment intiated successfully',
      transactionId: transaction._id,
      bankTransactionId: bankResponse.data.transactionId,
      status: transaction.status
    });
  } catch (error) {
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
    // TODO: Implement transaction validation
    const { transactionId } = req.params;
    // CRITICAL: This is where instructor gets paid
    // 1. Find transaction record
    const transaction = await Transaction.findById(transactionId);
    if(!transaction) {
      return res.status(400).json({error: 'Transaction not found'});
    }
    // 2. Verify instructor owns it
    const course = await Course.findById(transaction.courseId);
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // 3. Call Bank API to validate and transfer funds
    const bankResponse = await axios.post(
      `${BANK_API_URL}/transactions/${transaction.bankTransactionId}/validate`
    );
    // 4. Update transaction status to COMPLETED
    transaction.status = 'completed';
    await transaction.save();
    // 5. Update enrollment to allow course access
    const enrollment = await Enrollment.findOne({
      courseId: transaction.courseId, 
      learnerId: transaction.learnerId
    });

    if(enrollment) {
      enrollment.isPaid = true;    
      await enrollment.save();
    }
    // 6. Return confirmation

    res.status(200).json({
      message: 'Transaction validated and payment completed successfully',
      transactionId: transaction._id,
      bankTransactionId: bankResponse.data.transactionId,
      status: transaction.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/bank/transactions
// Get transaction history for the current user
// ===========================================
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { learnerId: req.user.id },
        { instructorId: req.user.id }
      ]
    }).sort({ createdAt: -1 });

    // Enrich with course names
    const courseIds = [...new Set(transactions.map(t => t.courseId.toString()))];
    const courses = await Course.find({ _id: { $in: courseIds } });
    const courseMap = new Map(courses.map(c => [c._id.toString(), c.title]));

    const result = transactions.map(t => ({
      ...t.toJSON(),
      courseName: courseMap.get(t.courseId.toString()) || 'Unknown Course',
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
