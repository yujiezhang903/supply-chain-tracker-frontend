'use client';

import { useRouter } from 'next/navigation';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  setBrowserStorage,
  useBrowserStorage,
} from '@/lib/browser-storage';

export default function Header() {
  const router = useRouter();
  const accessToken = useBrowserStorage('accessToken');
  const storedEmail = useBrowserStorage('userEmail');
  const userEmail = accessToken ? storedEmail : null;

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    setBrowserStorage('accessToken', null);
    setBrowserStorage('userEmail', null);
    router.push('/dashboard');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: 1201 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Supply Chain Tracker
        </Typography>

        {userEmail ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {userEmail.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="body2">{userEmail}</Typography>

            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Button color="inherit" onClick={handleLogin}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
