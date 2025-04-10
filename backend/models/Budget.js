const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  limit: {
    type: Number,
    required: true
  },
  month: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget; 