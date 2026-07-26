'use client';

import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { TextMessageContent } from '../types';

interface TextMessageRendererProps {
  content: TextMessageContent;
}

export default function TextMessageRenderer({
  content,
}: TextMessageRendererProps) {
  return (
    <Box
      sx={{
        overflowWrap: 'anywhere',
        '& p': { my: 0, mb: 1 },
        '& p:last-child': { mb: 0 },
        '& ul, & ol': { my: 1, pl: 3 },
        '& h1, & h2, & h3': { mt: 1.5, mb: 1 },
        '& blockquote': {
          mx: 0,
          my: 1,
          pl: 1.5,
          borderLeft: '3px solid',
          borderColor: 'divider',
          color: 'text.secondary',
        },
        '& pre': {
          m: 0,
          my: 1,
          p: 1.5,
          overflowX: 'auto',
          bgcolor: 'action.hover',
          borderRadius: 1,
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.875em',
        },
        '& table': {
          width: '100%',
          my: 1,
          borderCollapse: 'collapse',
        },
        '& th, & td': {
          px: 1,
          py: 0.75,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'left',
        },
        '& a': { color: 'primary.main' },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content.markdown}
      </ReactMarkdown>
    </Box>
  );
}
