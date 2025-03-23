import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import Layout from '../Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    monthlyReports: true,
    budgetAlerts: true,
    darkMode: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      if (profileData.newPassword) {
        formData.append('currentPassword', profileData.currentPassword);
        formData.append('newPassword', profileData.newPassword);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await axios.put(
        'http://localhost:5000/api/users/profile',
        formData,
        config
      );

      setSuccess(true);
      if (profileData.newPassword) {
        setProfileData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid item>
              <Avatar
                sx={{ width: 80, height: 80 }}
                src={avatarPreview || undefined}
              >
                <AccountIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6">{user?.name}</Typography>
              <Typography color="textSecondary">{user?.email}</Typography>
            </Grid>
            <Grid item>
              <Button variant="outlined" component="label">
                Upload Photo
                <input 
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={profileData.currentPassword}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={profileData.newPassword}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Notifications & Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={handlePreferenceChange}
                      name="emailNotifications"
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.monthlyReports}
                      onChange={handlePreferenceChange}
                      name="monthlyReports"
                    />
                  }
                  label="Monthly Financial Reports"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.budgetAlerts}
                      onChange={handlePreferenceChange}
                      name="budgetAlerts"
                    />
                  }
                  label="Budget Alerts"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.darkMode}
                      onChange={handlePreferenceChange}
                      name="darkMode"
                    />
                  }
                  label="Dark Mode"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </form>
        </Paper>

        <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
          <Typography variant="h6" gutterBottom color="error.contrastText">
            Danger Zone
          </Typography>
          <Typography variant="body2" color="error.contrastText" sx={{ mb: 2 }}>
            Once you delete your account, there is no going back. Please be certain.
          </Typography>
          <Button variant="contained" color="error">
            Delete Account
          </Button>
        </Paper>
      </Box>
    </Layout>
  );
};

export default Profile; 