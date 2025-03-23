import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel,
  Select,
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

interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  account?: {
    _id: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
  };
}

interface BankAccount {
  _id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  balance: number;
}

const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    account: '',
  });
  const { user } = useAuth();

  const fetchTransactions = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const response = await axios.get('http://localhost:5000/api/transactions', config);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const response = await axios.get('http://localhost:5000/api/bank-accounts', config);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [user]);

  // Filter transactions based on selected account
  const filteredTransactions = transactions.filter(t => 
    selectedAccount === 'all' || t.account?._id === selectedAccount
  );

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewTransaction({
      amount: '',
      type: 'expense',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      account: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      await axios.post(
        'http://localhost:5000/api/transactions',
        newTransaction,
        config
      );
      handleClose();
      fetchTransactions();
      fetchAccounts(); // Refresh accounts to update balances
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
      fetchTransactions();
      fetchAccounts(); // Refresh accounts to update balances
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  return (
    <Layout>
      <Box sx={{ width: '100%', mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="contained" onClick={handleClickOpen}>
          Add Transaction
        </Button>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Account</InputLabel>
          <Select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            label="Filter by Account"
          >
            <MenuItem value="all">All Accounts</MenuItem>
            {accounts.map((account) => (
              <MenuItem key={account._id} value={account._id}>
                {`${account.bankName} - ${account.accountType} ${account.accountNumber ? `(*${account.accountNumber.slice(-4)})` : '(XXXX)'}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>
                  {transaction.account 
                    ? `${transaction.account.bankName} ${transaction.account.accountNumber ? `(*${transaction.account.accountNumber.slice(-4)})` : '(XXXX)'}`
                    : 'No Account Selected'}
                </TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell align="right">
                  ₹{transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleDelete(transaction._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={newTransaction.amount}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, amount: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Type"
            select
            fullWidth
            value={newTransaction.type}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, type: e.target.value })
            }
          >
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Account"
            select
            fullWidth
            required
            value={newTransaction.account}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, account: e.target.value })
            }
          >
            {accounts.map((account) => (
              <MenuItem key={account._id} value={account._id}>
                {`${account.bankName} - ${account.accountType} ${account.accountNumber ? `(*${account.accountNumber.slice(-4)})` : '(XXXX)'}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Category"
            select
            fullWidth
            value={newTransaction.category}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, category: e.target.value })
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
            label="Description"
            fullWidth
            value={newTransaction.description}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, description: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={newTransaction.date}
            onChange={(e) =>
              setNewTransaction({ ...newTransaction, date: e.target.value })
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!newTransaction.account || !newTransaction.amount || !newTransaction.category}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default TransactionList; 