'use client';

import {
  Alert,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type { ConfirmationMessageContent } from '../types';

interface ConfirmationMessageRendererProps {
  content: ConfirmationMessageContent;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function ConfirmationMessageRenderer({
  content,
  onConfirm,
  onCancel,
}: ConfirmationMessageRendererProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {content.title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {content.description}
        </Typography>

        {content.status === 'pending' && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={onConfirm}
              disabled={!onConfirm}
            >
              {content.confirmLabel ?? 'Confirm'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              onClick={onCancel}
              disabled={!onCancel}
            >
              {content.cancelLabel ?? 'Cancel'}
            </Button>
          </Stack>
        )}

        {content.status === 'confirmed' && (
          <Alert severity="success">Action confirmed.</Alert>
        )}

        {content.status === 'cancelled' && (
          <Alert severity="info">Action cancelled.</Alert>
        )}
      </Stack>
    </Paper>
  );
}
