import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Layout from '../Layout/Layout';

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

const Analytics = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const { user } = useAuth();

  useEffect(() => {
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

    fetchTransactions();
  }, [user?.token]);

  // Helper function to group transactions by date
  const groupTransactionsByDate = () => {
    const grouped = transactions.reduce((acc: { [key: string]: number }, transaction) => {
      const date = new Date(transaction.date);
      let key: string;
      
      if (timeframe === 'week') {
        key = date.toISOString().split('T')[0];
      } else if (timeframe === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (transaction.type === 'expense') {
        acc[key] = (acc[key] || 0) + transaction.amount;
      }
      return acc;
    }, {});

    return grouped;
  };

  // Helper function to group transactions by category
  const groupTransactionsByCategory = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: { [key: string]: number }, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {});
  };

  // Calculate spending trends
  const spendingTrends = groupTransactionsByDate();
  const categorySpending = groupTransactionsByCategory();

  // Prepare data for line chart
  const lineChartData = {
    labels: Object.keys(spendingTrends).sort(),
    datasets: [
      {
        label: 'Spending Over Time',
        data: Object.keys(spendingTrends).sort().map(key => spendingTrends[key]),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  // Prepare data for category breakdown
  const doughnutChartData = {
    labels: Object.keys(categorySpending),
    datasets: [
      {
        data: Object.values(categorySpending),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  // Calculate total spending
  const totalSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate average daily spending
  const uniqueDates = new Set(transactions.map(t => t.date.split('T')[0]));
  const averageDailySpending = totalSpending / Math.max(uniqueDates.size, 1);

  // Find highest spending category
  const highestCategory = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)[0] || ['None', 0];

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value as 'week' | 'month' | 'year');
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Spending Analytics
        </Typography>

        <Grid container spacing={3}>
          {/* Timeframe Selector */}
          <Grid item xs={12}>
            <FormControl>
              <InputLabel>Timeframe</InputLabel>
              <Select value={timeframe} label="Timeframe" onChange={handleTimeframeChange}>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Spending
                </Typography>
                <Typography variant="h4">₹{totalSpending.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Daily Spending
                </Typography>
                <Typography variant="h4">₹{averageDailySpending.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Highest Spending Category
                </Typography>
                <Typography variant="h4">{highestCategory[0]}</Typography>
                <Typography variant="subtitle1">₹{(highestCategory[1] as number).toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Spending Trend Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spending Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut 
                  data={doughnutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Category Details */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {Object.entries(categorySpending)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">
                        {category}
                      </Typography>
                      <Typography variant="h6">
                        ₹{(amount as number).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {((amount as number / totalSpending) * 100).toFixed(1)}% of total spending
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Analytics; 