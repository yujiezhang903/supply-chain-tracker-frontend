'use client';

import Link from 'next/link';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Company', href: '/company' },
  { label: 'Order', href: '/order' },
  { label: 'User', href: '/user' },
];

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Supply Chain Tracker
        </Typography>

        <Box>
          {navItems.map((item) => (
            <Button key={item.href} color="inherit" component={Link} href={item.href}>
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
