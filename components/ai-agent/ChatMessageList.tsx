'use client';

import { Box, Paper, Stack, Typography } from '@mui/material';

import MessageRenderer from './renderers/MessageRenderer';
import type { ChatMessage } from './types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  onConfirm?: (messageId: string) => void;
  onCancel?: (messageId: string) => void;
}

export default function ChatMessageList({
  messages,
  onConfirm,
  onCancel,
}: ChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        No messages yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            <Box
              sx={{
                width: isUser ? 'auto' : '100%',
                maxWidth: isUser ? 680 : 960,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mb: 0.5,
                  textAlign: isUser ? 'right' : 'left',
                }}
              >
                {isUser ? 'You' : 'AI Agent'}
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  overflowX: 'auto',
                  borderColor: isUser ? '#b7e4d2' : 'divider',
                  backgroundColor: isUser ? '#e8f7f1' : 'background.paper',
                }}
              >
                <MessageRenderer
                  message={message}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
              </Paper>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
