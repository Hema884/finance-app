import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Layout from '../Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface BankAccount {
  _id: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit';
  accountNumber: string;
  balance: number;
  lastSync: string;
}

const BankAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountType: 'checking',
    accountNumber: '',
    balance: '',
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      const response = await axios.get('http://localhost:5000/api/bank-accounts', config);
      setAccounts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewAccount({
      bankName: '',
      accountType: 'checking',
      accountNumber: '',
      balance: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      await axios.post(
        'http://localhost:5000/api/bank-accounts',
        newAccount,
        config
      );
      handleClose();
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (accountId: string) => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      };
      await axios.post(
        `http://localhost:5000/api/bank-accounts/${accountId}/sync`,
        {},
        config
      );
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Bank Accounts</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
          >
            Add Account
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {accounts.map((account) => (
            <Grid item xs={12} md={6} lg={4} key={account._id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{account.bankName}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateBalance(account._id)}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                </Typography>
                <Typography variant="h5" sx={{ mb: 1 }}>
                ₹{account.balance.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Account: ****{account.accountNumber.slice(-4)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last Updated: {new Date(account.lastSync).toLocaleDateString()}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Add Bank Account</DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Bank Name"
                name="bankName"
                value={newAccount.bankName}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                select
                label="Account Type"
                name="accountType"
                value={newAccount.accountType}
                onChange={handleInputChange}
                margin="normal"
                required
              >
                <MenuItem value="checking">Checking</MenuItem>
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Account Number"
                name="accountNumber"
                value={newAccount.accountNumber}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Current Balance"
                name="balance"
                type="number"
                value={newAccount.balance}
                onChange={handleInputChange}
                margin="normal"
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default BankAccounts; 