'use client';

import { type ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

import FloatingChatWidget from '@/components/ai-agent/FloatingChatWidget';
import { useBrowserStorage, useHydrated } from '@/lib/browser-storage';

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
  const hydrated = useHydrated();
  const accessToken = useBrowserStorage('accessToken');

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  useEffect(() => {
    if (hydrated && isProtectedRoute && !accessToken) {
      router.replace('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [accessToken, hydrated, isProtectedRoute, pathname, router]);

  if (isProtectedRoute && (!hydrated || !accessToken)) {
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
      {hydrated && accessToken ? <FloatingChatWidget /> : null}
    </>
  );
}
