const express = require('express');
const router = express.Router();
const BankAccount = require('../models/BankAccount');

// ===========================================
// POST /api/accounts/setup
// Setup or verify bank account
// ===========================================
router.post('/setup', async (req, res) => {
  try {
    const { accountNumber, secret, userId, type } = req.body;

    const acct = typeof accountNumber === 'string' ? accountNumber.trim() : '';
    const sec = typeof secret === 'string' ? secret.trim() : '';
    const uid = typeof userId === 'string' ? userId.trim() : '';
    const acctType = typeof type === 'string' ? type.trim() : '';

    // TODO: Implement account setup
    // 1. Validate accountNumber format (min 10 chars)
    if (!acct || acct.length < 10) {
      return res.status(400).json({ error: 'Invalid account number format' });
    }
    // 2. Validate secret (min 6 chars)
    if (!sec || sec.length < 6) {
      return res.status(400).json({ error: 'Invalid secret format' });
    }
    // 3. Validate type
    if (!acctType || !['learner', 'instructor', 'lms_org'].includes(acctType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    // 3b. Validate userId presence
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // 4. Check if account already exists
    let account = await BankAccount.findOne({ accountNumber: acct });
    
    if (account) {
      // Account exists - verify secret
      if (account.secret !== sec) {
        return res.status(401).json({ error: 'Invalid secret for existing account' });
      }
      // Secret matches - return verified account
      return res.status(200).json({
        message: 'Account verified',
        account: {
          accountNumber: account.accountNumber,
          balance: account.balance,
          type: account.type
        }
      });
    }
    // 5. Create new account with initial balance $10,000
    const newAccount = new BankAccount({
      accountNumber: acct,
      secret: sec,
      userId: uid,
      type: acctType,
      balance : 10000,
      isActive: true
    });
    await newAccount.save();
    // 6. Return new account details
    return res.status(201).json({
      message: 'Account created successfully',
      account: {
        accountNumber: newAccount.accountNumber,
        balance: newAccount.balance,
        type: newAccount.type
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// GET /api/accounts/:accountNumber/balance
// Get account balance
// Requires secret verification
// ===========================================
router.get('/:accountNumber/balance', async (req, res) => {
  try {
    const { secret } = req.query; // Secret passed as query param
    if(!secret) {
      return res.status(400).json({ error: 'Secret is required' });
    }
    // TODO: Implement get balance
    // 1. Find account by accountNumber
    const account = await BankAccount.findOne({ accountNumber: req.params.accountNumber });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    // 2. Verify secret matches
    if (account.secret !== secret) {
      return res.status(401).json({ error: 'Invalid secret' });
    }
    // 3. Return balance

    return res.status(200).json({
      accountNumber: account.accountNumber,
      balance: account.balance,
      type: account.type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
