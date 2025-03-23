const express = require('express');
const router = express.Router();
const BankAccount = require('../models/BankAccount');
const { protect } = require('../middleware/auth');

// Get all bank accounts for a user
router.get('/', protect, async (req, res) => {
  try {
    const accounts = await BankAccount.find({ user: req.user._id });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new bank account manually
router.post('/manual', protect, async (req, res) => {
  try {
    const { bankName, accountType, accountNumber, balance } = req.body;
    
    const account = await BankAccount.create({
      user: req.user._id,
      bankName,
      accountType,
      accountNumber,
      balance
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Connect bank account via Plaid
router.post('/plaid/connect', protect, async (req, res) => {
  try {
    // Here we would integrate with Plaid API
    // 1. Create link token
    // 2. Exchange public token for access token
    // 3. Fetch account data
    res.status(501).json({ message: 'Plaid integration coming soon' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync transactions from bank
router.post('/:id/sync', protect, async (req, res) => {
  try {
    const account = await BankAccount.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Here we would:
    // 1. Use Plaid to fetch latest transactions
    // 2. Update local transaction records
    // 3. Update account balance

    account.lastSync = new Date();
    await account.save();

    res.json({ message: 'Sync completed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 