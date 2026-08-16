'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Container, TextField, Typography } from '@mui/material';

import { apiUrl } from '@/lib/api';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emailError = email.length > 0 && !emailRegex.test(email);
  const passwordError = password.length > 0 && password.length < 6;

  const handleSignup = async () => {
    setError('');
    setMessage('');

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
      const res = await fetch(apiUrl('/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      setMessage(data.message || 'Registration successful');
      setTimeout(() => router.push('/login'), 1000);
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4">Signup</Typography>

        {message && <Alert severity="success">{message}</Alert>}
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

        <Button variant="contained" onClick={handleSignup}>
          Signup
        </Button>

        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </Box>
    </Container>
  );
}

