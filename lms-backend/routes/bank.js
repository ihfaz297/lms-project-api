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

    // TODO: Implement bank setup
    // 1. Validate accountNumber and secret
    // 2. Call Bank API to verify/create account
    // 3. Store accountNumber and secret in user document
    // 4. Set hasBankSetup to true
    // 5. Return success message

    res.status(200).json({ message: 'Bank setup endpoint ready' });
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
    // 2. Call Bank API to get balance
    // 3. Return balance

    res.status(200).json({ message: 'Get balance endpoint ready' });
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
    // 2. Call Bank API to process payment (learner -> LMS org)
    // 3. Store transaction record in DB
    // 4. Return transaction confirmation

    res.status(200).json({ message: 'Payment endpoint ready' });
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
    // CRITICAL: This is where instructor gets paid
    // 1. Find transaction record
    // 2. Verify instructor owns it
    // 3. Call Bank API to validate and transfer funds
    // 4. Update transaction status to COMPLETED
    // 5. Update enrollment to allow course access
    // 6. Return confirmation

    res.status(200).json({ message: 'Validate transaction endpoint ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
