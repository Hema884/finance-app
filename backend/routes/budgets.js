const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

// Get all budgets
router.get('/', protect, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user._id });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add budget
router.post('/', protect, async (req, res) => {
  try {
    const { category, limit, month } = req.body;

    const budget = await Budget.create({
      user: req.user._id,
      category,
      limit,
      month,
    });

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update budget
router.put('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check user
    if (budget.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedBudget);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget
router.delete('/:id', protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Check user
    if (budget.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await budget.remove();
    res.json({ message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 