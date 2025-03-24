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
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new bank account (root endpoint)
router.post('/', protect, async (req, res) => {
  console.log('Received POST request to create bank account');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  try {
    const { bankName, accountType, accountNumber, balance } = req.body;
    
    // Validate required fields
    if (!bankName || !accountType || !accountNumber) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'Please provide bankName, accountType, and accountNumber',
        received: { bankName, accountType, accountNumber, balance }
      });
    }

    const account = await BankAccount.create({
      user: req.user._id,
      bankName,
      accountType,
      accountNumber,
      balance: balance || 0
    });

    console.log('Created account:', account);
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
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