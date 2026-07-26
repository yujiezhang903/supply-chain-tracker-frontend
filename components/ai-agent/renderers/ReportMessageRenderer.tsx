'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type { ReportMessageContent } from '../types';

interface ReportMessageRendererProps {
  content: ReportMessageContent;
}

export default function ReportMessageRenderer({
  content,
}: ReportMessageRendererProps) {
  const status = content.status ?? 'ready';

  return (
    <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {content.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {content.summary}
          </Typography>
        </Box>

        {status === 'generating' && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Generating report...</Typography>
          </Stack>
        )}

        {status === 'failed' && (
          <Alert severity="error">The report could not be generated.</Alert>
        )}

        {status === 'ready' && content.downloadUrl && (
          <Button
            component="a"
            href={content.downloadUrl}
            download={content.fileName}
            variant="contained"
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          >
            Download {content.fileName ?? 'report'}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
