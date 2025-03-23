const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const { protect } = require('../middleware/auth');

// Get all transactions
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('account', 'bankName accountNumber accountType')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add transaction
router.post('/', protect, async (req, res) => {
  try {
    const { amount, type, category, description, date, account } = req.body;

    // Create the transaction
    const transaction = new Transaction({
      user: req.user._id,
      amount: Number(amount),
      type,
      category,
      description,
      date: date || Date.now(),
      account
    });

    // Update bank account balance
    const bankAccount = await BankAccount.findById(account);
    if (!bankAccount) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Update balance based on transaction type
    if (type === 'income') {
      bankAccount.balance += Number(amount);
    } else {
      bankAccount.balance -= Number(amount);
    }

    // Save both transaction and updated account
    await Promise.all([
      transaction.save(),
      bankAccount.save()
    ]);

    // Populate account details before sending response
    await transaction.populate('account', 'bankName accountNumber accountType');
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('account');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check user
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update bank account balance
    if (transaction.account) {
      const bankAccount = await BankAccount.findById(transaction.account._id);
      if (bankAccount) {
        // Reverse the transaction effect on balance
        if (transaction.type === 'income') {
          bankAccount.balance -= transaction.amount;
        } else {
          bankAccount.balance += transaction.amount;
        }
        await bankAccount.save();
      }
    }

    // Use deleteOne instead of remove
    await Transaction.deleteOne({ _id: transaction._id });
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update transaction
router.put('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check user
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 