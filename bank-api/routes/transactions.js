const express = require('express');
const router = express.Router();
const BankAccount = require('../models/BankAccount');
const BankTransaction = require('../models/BankTransaction');

// ===========================================
// POST /api/transactions/transfer
// Process money transfer between accounts
// Called by LMS when: learner pays for course, instructor gets paid, etc.
// ===========================================
router.post('/transfer', async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, secret, reason } = req.body;

    const fromAccNum = typeof fromAccount === 'string' ? fromAccount.trim() : '';
    const toAccNum = typeof toAccount === 'string' ? toAccount.trim() : '';
    const sec = typeof secret === 'string' ? secret.trim() : '';
    const amountNum = Number(amount);
    const reasonStr = typeof reason === 'string' ? reason.trim() : '';

    if (!fromAccNum || !toAccNum || !sec) {
      return res.status(400).json({ error: 'fromAccount, toAccount, and secret are required' });
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (fromAccNum === toAccNum) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }
    if (!reasonStr || reasonStr.length > 200) {
      return res.status(400).json({ error: 'Reason is required and must be under 200 chars' });
    }

    // 1. Validate fromAccount exists and secret matches
    const fromAcc = await BankAccount.findOne({ accountNumber: fromAccNum });
    if (!fromAcc) {
      return res.status(400).json({ error: 'From account does not exist' });
    }
    if (fromAcc.secret !== sec) {
      return res.status(401).json({ error: 'Invalid secret' });
    }

    // 2. Validate toAccount exists
    const toAcc = await BankAccount.findOne({ accountNumber: toAccNum });
    if (!toAcc) {
      return res.status(400).json({ error: 'To account does not exist' });
    }

    // 3. Check if fromAccount has sufficient balance
    if (fromAcc.balance < amountNum) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 4. Create transaction record (status: pending)
    const transaction = new BankTransaction({
      fromAccount: fromAccNum,
      toAccount: toAccNum,
      amount: amountNum,
      reason: reasonStr,
      status: 'pending',
      createdAt: new Date()
    });

    // Use session for atomic operations
    const session = await BankAccount.startSession();
    session.startTransaction();
    try {
      await transaction.save({ session });

      // 5. Deduct amount from fromAccount
      fromAcc.balance -= amountNum;
      await fromAcc.save({ session });

      // 6. Add amount to toAccount
      toAcc.balance += amountNum;
      await toAcc.save({ session });

      // 7. Update transaction status to completed
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      await transaction.save({ session });

      await session.commitTransaction();

      // 8. Return transactionId and confirmation
      return res.status(200).json({
        message: 'Transfer completed successfully',
        transactionId: transaction._id
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/transactions/:transactionId
// Get transaction details
// ===========================================
router.get('/:transactionId', async (req, res) => {
  try {
    const transaction = await BankTransaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// POST /api/transactions/:transactionId/validate
// Verify transaction is completed
// Called by instructor to confirm payment received
// ===========================================
router.post('/:transactionId/validate', async (req, res) => {
  try {
    const transaction = await BankTransaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Transaction not completed' });
    }
    res.status(200).json({ message: 'Transaction is valid and completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
