'use client';

import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useCallback, useEffect, useRef, useState } from 'react';

import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';
import {
  attachmentsFromFiles,
  normalizeChatMessage,
  normalizeChatMessages,
} from './lib/message-normalizer';
import { createTextMessage } from './lib/chat-session';
import type { ChatMessage } from './types';
import { apiUrl } from '@/lib/api';
import {
  setBrowserStorage,
  useBrowserStorage,
} from '@/lib/browser-storage';

const PROVIDERS = [
  { value: 'mock', label: 'Local mock' },
  { value: 'deepseek', label: 'DeepSeek V4' },
  { value: 'qwen', label: 'Qwen 3.5' },
  { value: 'openai', label: 'GPT' },
] as const;

type Provider = (typeof PROVIDERS)[number]['value'];

interface ChatWindowProps {
  embedded?: boolean;
  open?: boolean;
  onClose?: () => void;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }

  return {};
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(value: unknown, fallback: string): string {
  const message = asRecord(value).message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return typeof message === 'string' && message.trim()
    ? message
    : fallback;
}

function normalizeProvider(value: string | null): Provider {
  return PROVIDERS.some((provider) => provider.value === value)
    ? (value as Provider)
    : 'mock';
}

function authorizationHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');

  return token ? { Authorization: 'Bearer ' + token } : {};
}

function messageForFileOnlyRequest(files: File[]): string {
  if (files.length === 0) {
    return '';
  }

  return 'Please analyse the attached file' + (files.length > 1 ? 's' : '') + '.';
}

/**
 * Shared AI conversation surface for both the full page and floating dialog.
 * The backend session is authoritative; browser storage keeps only the latest
 * session ID and selected provider.
 */
export default function ChatWindow({
  embedded = false,
  open = false,
  onClose,
}: ChatWindowProps) {
  const visible = embedded || open;
  const storedProvider = useBrowserStorage('ai-agent-provider');
  const provider = normalizeProvider(storedProvider);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createTextMessage(
      'assistant',
      'Hello! I can help with your supply-chain data. Ask a question or attach a file to get started.',
    ),
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadSession = useCallback(async (id: string, signal: AbortSignal) => {
    const response = await fetch(
      apiUrl('/ai-agent/sessions/' + encodeURIComponent(id)),
      {
        cache: 'no-store',
        headers: authorizationHeaders(),
        signal,
      },
    );
    const payload = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(payload, 'Unable to load this conversation.'),
      );
    }

    const record = asRecord(payload);
    const storedMessages = Array.isArray(record.messages)
      ? normalizeChatMessages(record.messages)
      : [];

    if (signal.aborted) {
      return;
    }

    setSessionId(id);
    setMessages(
      storedMessages.length > 0
        ? storedMessages
        : [
            createTextMessage(
              'assistant',
              'This conversation is empty. Send a message to begin.',
            ),
          ],
    );

    if (
      record.provider === 'mock' ||
      record.provider === 'deepseek' ||
      record.provider === 'qwen' ||
      record.provider === 'openai'
    ) {
      setBrowserStorage('ai-agent-provider', record.provider);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    // The floating widget stays mounted while hidden. Restore history only
    // after it becomes visible so closed widgets do not issue background calls.
    const storedSessionId = localStorage.getItem('ai-agent-session-id');

    if (!storedSessionId) {
      return;
    }

    const controller = new AbortController();

    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) {
          return;
        }

        setLoadingHistory(true);
        setError('');
        return loadSession(storedSessionId, controller.signal);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) {
          return;
        }

        localStorage.removeItem('ai-agent-session-id');
        setSessionId(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to restore the conversation.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingHistory(false);
        }
      });

    return () => controller.abort();
  }, [loadSession, visible]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingHistory]);

  const startNewConversation = () => {
    if (sending || loadingHistory) {
      return;
    }

    localStorage.removeItem('ai-agent-session-id');
    setSessionId(null);
    setMessages([
      createTextMessage(
        'assistant',
        'New conversation started. How can I help?',
      ),
    ]);
    setError('');
  };

  const updateConfirmation = (
    messageId: string,
    status: 'confirmed' | 'cancelled',
  ) => {
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId || message.type !== 'confirmation') {
          return message;
        }

        return {
          ...message,
          content: {
            ...message.content,
            status,
          },
        };
      }),
    );
  };

  const sendMessage = async (value: string, files: File[]) => {
    if (sending) {
      return;
    }

    const content = value.trim() || messageForFileOnlyRequest(files);

    if (!content && files.length === 0) {
      return;
    }

    const userMessage = createTextMessage(
      'user',
      content,
      attachmentsFromFiles(files),
    );
    setMessages((current) => [...current, userMessage]);
    setSending(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('provider', provider);

      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      files.forEach((file) => formData.append('files', file));

      const response = await fetch(apiUrl('/ai-agent/chat'), {
        method: 'POST',
        headers: authorizationHeaders(),
        body: formData,
      });
      const payload = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, 'The AI Agent request failed.'),
        );
      }

      const record = asRecord(payload);
      const session = asRecord(record.session);
      const nextSessionId =
        typeof session.id === 'string'
          ? session.id
          : typeof record.sessionId === 'string'
            ? record.sessionId
            : '';

      if (!nextSessionId) {
        throw new Error('The backend did not return a session ID.');
      }

      setSessionId(nextSessionId);
      localStorage.setItem('ai-agent-session-id', nextSessionId);

      // Prefer the complete persisted session. Older response envelopes only
      // contain assistantMessage, so append it to the optimistic conversation
      // instead of replacing and losing all earlier messages.
      if (Array.isArray(session.messages)) {
        setMessages(normalizeChatMessages(session.messages));
      } else if (
        record.assistantMessage !== null &&
        record.assistantMessage !== undefined
      ) {
        setMessages((current) => [
          ...current,
          normalizeChatMessage(record.assistantMessage, current.length),
        ]);
      }
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : 'Unknown AI Agent error.';

      setError(message);
      setMessages((current) => [
        ...current,
        createTextMessage(
          'assistant',
          'I could not complete that request.\\n\\n**' + message + '**',
        ),
      ]);
    } finally {
      setSending(false);
    }
  };

  const header = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          AI Agent
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Persistent conversation
        </Typography>
      </Box>

      <Select
        size="small"
        value={provider}
        disabled={sending || loadingHistory}
        onChange={(event) => {
          const nextProvider = event.target.value as Provider;
          setBrowserStorage('ai-agent-provider', nextProvider);
        }}
        sx={{ minWidth: 132 }}
        aria-label="AI model"
      >
        {PROVIDERS.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>

      <IconButton
        size="small"
        onClick={startNewConversation}
        disabled={sending || loadingHistory}
        aria-label="New conversation"
        title="New conversation"
      >
        <AddIcon fontSize="small" />
      </IconButton>

      {!embedded && (
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close AI Agent"
          title="Close AI Agent"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const body = (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: embedded ? 460 : 420,
        maxHeight: embedded ? 'calc(100vh - 330px)' : 520,
        overflowY: 'auto',
        p: { xs: 1.5, sm: 2 },
        bgcolor: '#f8fafc',
      }}
    >
      {error && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loadingHistory ? (
        <Stack
          spacing={1}
          sx={{
            minHeight: 360,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={26} />
          <Typography variant="body2" color="text.secondary">
            Restoring conversation...
          </Typography>
        </Stack>
      ) : (
        <ChatMessageList
          messages={messages}
          onConfirm={(id) => updateConfirmation(id, 'confirmed')}
          onCancel={(id) => updateConfirmation(id, 'cancelled')}
        />
      )}

      <Box ref={messagesEndRef} />
    </Box>
  );

  const input = (
    <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <ChatInput
        disabled={sending || loadingHistory}
        onSend={sendMessage}
        placeholder="Ask about companies, orders or relationships..."
      />
    </Box>
  );

  if (!visible) {
    return null;
  }

  if (embedded) {
    return (
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 650,
        }}
      >
        {header}
        {body}
        {input}
      </Paper>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            height: { xs: '100%', sm: 'min(760px, calc(100vh - 48px))' },
            maxHeight: 'none',
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>{header}</DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {body}
        {input}
      </DialogContent>
    </Dialog>
  );
}
