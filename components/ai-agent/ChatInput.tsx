
'use client';

import {
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useRef, useState } from 'react';

interface ChatInputProps {
  disabled?: boolean;
  placeholder?: string;
  onSend: (value: string, files: File[]) => void;
}

export default function ChatInput({
  disabled = false,
  placeholder = 'Ask the AI Agent something...',
  onSend,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSend = value.trim().length > 0 || files.length > 0;

  const submit = () => {
    if (disabled || !canSend) {
      return;
    }

    onSend(value, files);
    setValue('');
    setFiles([]);
  };

  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles((current) => [...current, ...selected].slice(0, 5));
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  return (
    <Stack spacing={1}>
      {files.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', rowGap: 1 }}
        >
          {files.map((file, index) => (
            <Chip
              key={file.name + '-' + file.lastModified + '-' + index}
              label={file.name}
              size="small"
              variant="outlined"
              onDelete={() => removeFile(index)}
              deleteIcon={<CloseIcon />}
            />
          ))}
        </Stack>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <Tooltip title="Attach files">
          <IconButton
            component="label"
            disabled={disabled || files.length >= 5}
            size="small"
            sx={{ mb: 1 }}
          >
            <AttachFileIcon fontSize="small" />
            <input
              ref={fileInputRef}
              hidden
              type="file"
              multiple
              onChange={handleFiles}
            />
          </IconButton>
        </Tooltip>

        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={5}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />

        <Tooltip title="Send">
          <span>
            <IconButton
              color="primary"
              disabled={disabled || !canSend}
              onClick={submit}
              sx={{ mb: 1 }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Stack>
  );
}
