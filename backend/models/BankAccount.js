const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['checking', 'savings', 'credit'],
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  plaidAccessToken: {
    type: String
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
module.exports = BankAccount; 