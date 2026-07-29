'use client';

import { Box, Typography } from '@mui/material';

import ChatWindow from '@/components/ai-agent/ChatWindow';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AiAgentPage() {
  return (
    <DashboardLayout>
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          AI Agent
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
          Ask questions, attach files and analyse your supply-chain data.
        </Typography>

        <ChatWindow embedded />
      </Box>
    </DashboardLayout>
  );
}
