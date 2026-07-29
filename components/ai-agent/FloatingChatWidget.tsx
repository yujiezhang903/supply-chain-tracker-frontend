'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Button, Paper, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import ChatWindow from './ChatWindow';

const HIDDEN_PATHS = ['/login', '/signup', '/ai-agent'];

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (
    HIDDEN_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + '/'),
    )
  ) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
          zIndex: (theme) => theme.zIndex.modal - 1,
          width: { xs: 'calc(100vw - 32px)', sm: 340 },
        }}
      >
        <Tooltip title="Open AI Agent" placement="left">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Button
              fullWidth
              onClick={() => setOpen(true)}
              startIcon={<SmartToyIcon />}
              sx={{
                justifyContent: 'flex-start',
                px: 2,
                py: 1.5,
                color: 'text.primary',
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Ask AI Agent about your supply chain...
            </Button>
          </Paper>
        </Tooltip>
      </Box>

      <ChatWindow open={open} onClose={() => setOpen(false)} />
    </>
  );
}
