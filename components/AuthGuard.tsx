'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

import FloatingChatWidget from '@/components/ai-agent/FloatingChatWidget';

const protectedRoutes = [
  '/dashboard',
  '/company',
  '/order',
  '/user',
  '/ai-agent',
  '/agent-tasks',
];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAuthenticated(Boolean(token));

    if (isProtectedRoute && !token) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
      return;
    }

    setChecking(false);
  }, [isProtectedRoute, pathname, router]);

  if (checking && isProtectedRoute) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {children}
      {authenticated ? <FloatingChatWidget /> : null}
    </>
  );
}
