'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from '@mui/material';

import { apiUrl } from '@/lib/api';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const emailError = email.length > 0 && !emailRegex.test(email);
  const passwordError = password.length > 0 && password.length < 6;

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Email and password cannot be empty');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userEmail', email);

      router.push('/dashboard');
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4">Login</Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          helperText={emailError ? 'Please enter a valid email address' : ''}
          fullWidth
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          helperText={passwordError ? 'Password must be at least 6 characters' : ''}
          fullWidth
        />

        <Button variant="contained" onClick={handleLogin}>
          Login
        </Button>

        <Button onClick={() => router.push('/signup')}>Go to Signup</Button>
      </Box>
    </Container>
  );
}
