'use client';

import { useState } from 'react';
import { Box } from '@mui/material';

import Header from './Header';
import Sidebar from './Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 8,
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          transition: 'all 0.2s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
