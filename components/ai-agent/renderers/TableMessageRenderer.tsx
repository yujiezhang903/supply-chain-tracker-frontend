'use client';

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { TableMessageContent } from '../types';

interface TableMessageRendererProps {
  content: TableMessageContent;
}

function formatCellValue(
  value: string | number | boolean | null,
): string {
  if (value === null) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export default function TableMessageRenderer({
  content,
}: TableMessageRendererProps) {
  return (
    <Box sx={{ width: '100%' }}>
      {content.title && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {content.title}
        </Typography>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table
          size="small"
          aria-label={content.title ?? 'AI response table'}
          sx={{ minWidth: 480 }}
        >
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {content.columns.map((column) => (
                <TableCell key={column.key} sx={{ fontWeight: 600 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {content.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover>
                {content.columns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue(row[column.key] ?? null)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
