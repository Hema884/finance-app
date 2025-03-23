import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Warning,
  CheckCircle,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Layout from '../Layout/Layout';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface Transaction {
  _id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  account: {
    _id: string;
    bankName: string;
    accountNumber: string;
  };
}

interface BankAccount {
  _id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  balance: number;
}

interface Budget {
  _id: string;
  category: string;
  amount: number;
  spent: number;
}

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const { user } = useAuth();

  // Add chart IDs for proper cleanup
  const chartIds = React.useRef({
    category: 'category-chart',
    account: 'account-chart',
    trend: 'trend-chart'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        };

        const [transactionsRes, accountsRes, budgetsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/transactions', config),
          axios.get('http://localhost:5000/api/bank-accounts', config),
          axios.get('http://localhost:5000/api/budgets', config),
        ]);

        setTransactions(transactionsRes.data);
        setAccounts(accountsRes.data);
        setBudgets(budgetsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    // Refresh data every minute
    const intervalId = setInterval(fetchData, 60000);
    return () => {
      clearInterval(intervalId);
      // Cleanup charts on unmount
      const charts = ChartJS.instances;
      Object.keys(charts).forEach(key => {
        charts[key].destroy();
      });
    };
  }, [user?.token]);

  // Filter transactions based on selected account
  const filteredTransactions = transactions.filter(t => 
    selectedAccount === 'all' || t.account?._id === selectedAccount
  );

  // Recalculate metrics based on filtered transactions
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Get recent transactions
  const recentTransactions = transactions
    ? [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    : [];

  // Calculate budget status
  const budgetAlerts = budgets
    ? budgets
        .map(budget => {
          const spent = transactions
            .filter(t => t.category === budget.category && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          const percentage = (spent / budget.amount) * 100;
          return {
            ...budget,
            spent,
            percentage,
            status: percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : 'safe',
          };
        })
        .filter(budget => budget.status !== 'safe')
        .slice(0, 3)
    : [];

  // Update spending trends calculation
  const spendingTrends = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { [key: string]: number }, t) => {
      const date = new Date(t.date);
      const key = timeframe === 'week' 
        ? date.toISOString().split('T')[0]
        : timeframe === 'month'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          : date.getFullYear().toString();
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {});

  const trendData = {
    labels: Object.keys(spendingTrends).sort(),
    datasets: [{
      label: 'Spending',
      data: Object.keys(spendingTrends).sort().map(k => spendingTrends[k]),
      borderColor: '#4CAF50',
      tension: 0.4,
      fill: false,
    }],
  };

  // Update category breakdown calculation
  const categorySpending = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { [key: string]: number }, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const categoryData = {
    labels: Object.keys(categorySpending),
    datasets: [{
      data: Object.values(categorySpending),
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
      ],
    }],
  };

  // Prepare account spending data
  const accountSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: { [key: string]: number }, t) => {
      const accountName = t.account && t.account.bankName && t.account.accountNumber
        ? `${t.account.bankName} (*${t.account.accountNumber.slice(-4)})`
        : 'Other';
      acc[accountName] = (acc[accountName] || 0) + t.amount;
      return acc;
    }, {});

  const accountData = {
    labels: Object.keys(accountSpending),
    datasets: [{
      data: Object.values(accountSpending),
      backgroundColor: [
        '#4CAF50',
        '#2196F3',
        '#FFC107',
        '#9C27B0',
        '#F44336',
        '#795548',
      ],
    }],
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Account Selection Dropdown */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Account</InputLabel>
              <Select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                label="Select Account"
              >
                <MenuItem value="all">All Accounts</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.bankName} - {account.accountType} (*{account.accountNumber.slice(-4)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Financial Overview Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Balance
                </Typography>
                <Typography variant="h4">₹{totalBalance.toFixed(2)}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Across all accounts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Income
                </Typography>
                <Typography variant="h4" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  ₹{monthlyIncome.toFixed(2)}
                  <TrendingUp sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Expenses
                </Typography>
                <Typography variant="h4" color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  ₹{monthlyExpenses.toFixed(2)}
                  <TrendingDown sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Savings Rate
                </Typography>
                <Typography variant="h4" color={savingsRate >= 20 ? 'success.main' : 'warning.main'}>
                  {savingsRate.toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(savingsRate, 100)} 
                  color={savingsRate >= 20 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Charts Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  id={chartIds.current.category}
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        display: true,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spending by Account
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  id={chartIds.current.account}
                  data={accountData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        display: true,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Account Overview */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Account Overview
              </Typography>
              <List>
                {accounts.map((account) => (
                  <ListItem key={account._id}>
                    <ListItemText
                      primary={`${account.bankName} - ${account.accountType}`}
                      secondary={`**** ${account.accountNumber ? account.accountNumber.slice(-4) : 'XXXX'}`}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="subtitle1" color={account.balance >= 0 ? 'success.main' : 'error.main'}>
                        ₹{account.balance.toFixed(2)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Budget Alerts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Budget Alerts
              </Typography>
              <List>
                {budgetAlerts.map((budget) => (
                  <ListItem key={budget._id}>
                    <ListItemText
                      primary={budget.category}
                      secondary={`₹${budget.spent.toFixed(2)} of ₹${budget.amount.toFixed(2)}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        icon={budget.status === 'danger' ? <Warning /> : <Warning />}
                        label={`${budget.percentage.toFixed(1)}%`}
                        color={budget.status === 'danger' ? 'error' : 'warning'}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Spending Trends */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Spending Trends
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
                  >
                    <MenuItem value="week">Weekly</MenuItem>
                    <MenuItem value="month">Monthly</MenuItem>
                    <MenuItem value="year">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line
                  id={chartIds.current.trend}
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${value}`
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `₹${context.parsed.y}`
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Recent Transactions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <List>
                {recentTransactions.map((transaction) => (
                  <ListItem key={transaction._id}>
                    <ListItemText
                      primary={transaction.description}
                      secondary={
                        `${transaction.category} - ${new Date(transaction.date).toLocaleDateString()} - ` +
                        (transaction.account && transaction.account.bankName && transaction.account.accountNumber
                          ? `${transaction.account.bankName} (*${transaction.account.accountNumber.slice(-4)})` 
                          : 'Account Deleted')
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography
                        variant="subtitle2"
                        color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        {transaction.type === 'income' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                        ₹{transaction.amount.toFixed(2)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Spending Categories
              </Typography>
              <List>
                {Object.entries(categorySpending)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, amount]) => (
                    <ListItem key={category}>
                      <ListItemText
                        primary={category}
                        secondary={`${((amount / Object.values(categorySpending).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}% of total spending`}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="subtitle1" color="error.main">
                          ₹{amount.toFixed(2)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard; 