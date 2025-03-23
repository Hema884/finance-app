import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import Layout from '../Layout/Layout';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const categories = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Other',
];

const BudgetList = () => {
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: '',
    month: new Date().toISOString().split('T')[0].slice(0, 7),
  });
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const [budgetsRes, transactionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/budgets', config),
        axios.get('http://localhost:5000/api/transactions', config),
      ]);
      setBudgets(budgetsRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewBudget({
      category: '',
      limit: '',
      month: new Date().toISOString().split('T')[0].slice(0, 7),
    });
  };

  const handleSubmit = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      await axios.post('http://localhost:5000/api/budgets', newBudget, config);
      handleClose();
      fetchData();
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      await axios.delete(`http://localhost:5000/api/budgets/${id}`, config);
      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const calculateProgress = (category: string, limit: number) => {
    const spent = transactions
      .filter(
        (t: any) =>
          t.type === 'expense' &&
          t.category === category &&
          new Date(t.date).getMonth() === new Date().getMonth()
      )
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    return (spent / limit) * 100;
  };

  return (
    <Layout>
      <Box sx={{ width: '100%', mb: 2 }}>
        <Button variant="contained" onClick={handleClickOpen}>
          Add Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        {budgets.map((budget: any) => (
          <Grid item xs={12} md={6} key={budget._id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{budget.category}</Typography>
                <IconButton
                  onClick={() => handleDelete(budget._id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Typography variant="body1" gutterBottom>
                Limit: ₹{budget.limit.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Month: {new Date(budget.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              </Typography>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(calculateProgress(budget.category, budget.limit), 100)}
                  color={calculateProgress(budget.category, budget.limit) > 100 ? 'error' : 'primary'}
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Progress: {calculateProgress(budget.category, budget.limit).toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Budget</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Category"
            select
            fullWidth
            value={newBudget.category}
            onChange={(e) =>
              setNewBudget({ ...newBudget, category: e.target.value })
            }
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Monthly Limit"
            type="number"
            fullWidth
            value={newBudget.limit}
            onChange={(e) =>
              setNewBudget({ ...newBudget, limit: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Month"
            type="month"
            fullWidth
            value={newBudget.month}
            onChange={(e) =>
              setNewBudget({ ...newBudget, month: e.target.value })
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default BudgetList; 