'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatMessageList from '@/components/ai-agent/ChatMessageList';
import { createTextMessage } from '@/components/ai-agent/lib/chat-session';
import type { ChatMessage } from '@/components/ai-agent/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001';

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    type: 'text',
    createdAt: '2026-07-26T00:00:00.000Z',
    content: {
      markdown:
        'Hello! Ask me about **company levels, countries, revenue, employees or company lists**.',
    },
  },
];

const AI_PROVIDERS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'qwen', label: 'Qwen' },
] as const;

type AiProvider = (typeof AI_PROVIDERS)[number]['value'];

function isAiProvider(value: unknown): value is AiProvider {
  return value === 'deepseek' || value === 'qwen';
}

type AiAgentResponse = {
  session?: AiAgentSession;
  sessionId?: string;
  messages?: ChatMessage[];
  provider?: string;
  model?: string;
  userMessage?: ChatMessage;
  assistantMessage?: ChatMessage;
  message?: string | string[];
};

type AiAgentSession = {
  id: string;
  title?: string;
  provider?: string;
  messages?: ChatMessage[];
};

type AiAgentSessionSummary = {
  id: string;
  title: string;
  provider?: string;
  messages?: ChatMessage[];
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as JsonRecord;
      }
    } catch {
      return {
        type: 'text',
        text: value,
      };
    }
  }

  return {};
}

function formatMarkdownValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br />');
}

function normalizeMessages(
  messages: ChatMessage[],
): ChatMessage[] {
  return messages.map((message, index) => {
    const source = message as unknown as JsonRecord;
    const raw = asRecord(source.content);

    let markdown = '';

    if (typeof raw.markdown === 'string') {
      markdown = raw.markdown;
    } else if (raw.type === 'text') {
      markdown = String(raw.text ?? '');
    } else if (raw.type === 'table') {
      const title =
        typeof raw.title === 'string'
          ? raw.title
          : 'Results';

      const columns = Array.isArray(raw.columns)
        ? raw.columns
            .map((column) => {
              const item = asRecord(column);

              return {
                key: String(item.key ?? ''),
                label: String(
                  item.label ?? item.key ?? '',
                ),
              };
            })
            .filter((column) => column.key)
        : [];

      const rows = Array.isArray(raw.rows)
        ? raw.rows
        : [];

      if (columns.length > 0) {
        markdown = [
          `### ${title}`,
          '',
          `| ${columns
            .map((column) => column.label)
            .join(' | ')} |`,
          `| ${columns.map(() => '---').join(' | ')} |`,
          ...rows.map((row) => {
            const item = asRecord(row);

            return `| ${columns
              .map((column) =>
                formatMarkdownValue(item[column.key]),
              )
              .join(' | ')} |`;
          }),
        ].join('\n');
      } else {
        markdown = `### ${title}\n\nNo rows returned.`;
      }
    } else if (raw.type === 'chart') {
      const title =
        typeof raw.title === 'string'
          ? raw.title
          : 'Chart';

      const labels = Array.isArray(raw.labels)
        ? raw.labels
        : [];

      const datasets = Array.isArray(raw.datasets)
        ? raw.datasets
        : [];

      const lines = datasets.flatMap((dataset) => {
        const item = asRecord(dataset);
        const data = Array.isArray(item.data)
          ? item.data
          : [];

        const datasetLabel =
          typeof item.label === 'string'
            ? `${item.label}: `
            : '';

        return labels.map(
          (label, labelIndex) =>
            `- ${datasetLabel}${String(label)}: ${String(
              data[labelIndex] ?? 0,
            )}`,
        );
      });

      markdown = [
        `### ${title}`,
        '',
        ...lines,
      ].join('\n');
    } else if (raw.type === 'report') {
      markdown = [
        `### ${String(raw.title ?? 'Report')}`,
        '',
        String(raw.summary ?? ''),
      ].join('\n');
    } else if (raw.type === 'confirmation') {
      markdown = [
        `### ${String(
          raw.title ?? 'Confirmation',
        )}`,
        '',
        String(raw.description ?? ''),
      ].join('\n');
    } else if (typeof source.markdown === 'string') {
      markdown = source.markdown;
    } else if (typeof source.text === 'string') {
      markdown = source.text;
    }

    return {
      ...message,
      id:
        typeof source.id === 'string'
          ? source.id
          : `message-${index}`,
      // Every normalized message is rendered as markdown text.
      // Keeping type='table' here would make TableMessageRenderer
      // read columns from { markdown } and crash.
      type: 'text',
      content: {
        markdown: markdown || 'No response content.',
      },
    } as ChatMessage;
  });
}

async function readResponseBody(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function getErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  const data = asRecord(payload);
  const message = data.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

export default function AiAgentPage() {
  const [messages, setMessages] =
    useState<ChatMessage[]>(initialMessages);

  const [sessions, setSessions] = useState<
    AiAgentSessionSummary[]
  >([]);

  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] =
    useState<AiProvider>('deepseek');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] =
    useState(false);

  const [loadingSessionId, setLoadingSessionId] =
    useState<string | null>(null);

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [sessionError, setSessionError] = useState('');

  const [deleteTarget, setDeleteTarget] =
    useState<AiAgentSessionSummary | null>(null);

  const [deletingSessionId, setDeletingSessionId] =
    useState<string | null>(null);

  useEffect(() => {
    const savedProvider = localStorage.getItem(
      'ai-agent-provider',
    );

    if (isAiProvider(savedProvider)) {
      setSelectedProvider(savedProvider);
    }
  }, []);

  const handleProviderChange = (
    event: SelectChangeEvent<AiProvider>,
  ) => {
    const provider = event.target.value;

    if (!isAiProvider(provider)) {
      return;
    }

    setSelectedProvider(provider);
    localStorage.setItem('ai-agent-provider', provider);
  };

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true);

    try {
      const response = await fetch(
        `${API_URL}/ai-agent/sessions`,
        {
          cache: 'no-store',
        },
      );

      const payload = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            'Unable to load conversations.',
          ),
        );
      }

      if (!Array.isArray(payload)) {
        throw new Error('Invalid conversation list.');
      }

      setSessions(payload as AiAgentSessionSummary[]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadSession = useCallback(
    async (nextSessionId: string) => {
      const response = await fetch(
        `${API_URL}/ai-agent/sessions/${encodeURIComponent(
          nextSessionId,
        )}`,
        {
          cache: 'no-store',
        },
      );

      const payload = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            'Unable to load conversation.',
          ),
        );
      }

      const session = payload as AiAgentSession;

      if (!session || !session.id) {
        throw new Error('Invalid conversation response.');
      }

      const sessionMessages = Array.isArray(
        session.messages,
      )
        ? normalizeMessages(session.messages)
        : initialMessages;

      setSessionId(session.id);

      if (isAiProvider(session.provider)) {
        setSelectedProvider(session.provider);
        localStorage.setItem(
          'ai-agent-provider',
          session.provider,
        );
      }

      setMessages(
        sessionMessages.length > 0
          ? sessionMessages
          : initialMessages,
      );

      localStorage.setItem(
        'ai-agent-session-id',
        session.id,
      );
    },
    [],
  );

  useEffect(() => {
    void refreshSessions().catch((error) => {
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Unable to load conversation list.',
      );
    });

    const cachedSessionId = localStorage.getItem(
      'ai-agent-session-id',
    );

    if (!cachedSessionId) {
      return;
    }

    setLoadingSessionId(cachedSessionId);

    void loadSession(cachedSessionId)
      .catch(() => {
        localStorage.removeItem('ai-agent-session-id');
        setSessionId(null);
        setMessages(initialMessages);
      })
      .finally(() => {
        setLoadingSessionId(null);
      });
  }, [loadSession, refreshSessions]);

  const handleNewConversation = () => {
    if (loading) {
      return;
    }

    localStorage.removeItem('ai-agent-session-id');
    setSessionId(null);
    setMessages(initialMessages);
    setInput('');
    setSessionError('');
  };

  const handleSelectSession = async (
    nextSessionId: string,
  ) => {
    if (
      nextSessionId === sessionId ||
      loading ||
      loadingSessionId ||
      deletingSessionId
    ) {
      return;
    }

    setSessionError('');
    setLoadingSessionId(nextSessionId);

    try {
      await loadSession(nextSessionId);
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Unable to open this conversation.',
      );
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget || deletingSessionId) {
      return;
    }

    const deletingId = deleteTarget.id;

    setDeletingSessionId(deletingId);
    setSessionError('');

    try {
      const response = await fetch(
        `${API_URL}/ai-agent/sessions/${encodeURIComponent(
          deletingId,
        )}`,
        {
          method: 'DELETE',
        },
      );

      const payload = await readResponseBody(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Unable to delete conversation: ${response.status}`,
          ),
        );
      }

      setSessions((current) =>
        current.filter(
          (session) => session.id !== deletingId,
        ),
      );

      if (sessionId === deletingId) {
        localStorage.removeItem('ai-agent-session-id');
        setSessionId(null);
        setMessages(initialMessages);
        setInput('');
      }

      setDeleteTarget(null);
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Unable to delete this conversation.',
      );

      setDeleteTarget(null);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSend = async () => {
    const value = input.trim();

    if (!value || loading) {
      return;
    }

    const userMessage = normalizeMessages([
      createTextMessage('user', value),
    ])[0];

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput('');
    setLoading(true);
    setSessionError('');

    try {
      const response = await fetch(
        `${API_URL}/ai-agent/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            content: value,
            provider: selectedProvider,
            ...(sessionId ? { sessionId } : {}),
          }),
        },
      );

      const payload = await readResponseBody(response);
      const data = (payload ?? {}) as AiAgentResponse;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Request failed: ${response.status}`,
          ),
        );
      }

      const returnedSession =
        data.session ??
        (data.sessionId
          ? {
              id: data.sessionId,
              messages: data.messages,
            }
          : undefined);

      if (!returnedSession?.id) {
        throw new Error(
          'Invalid response from AI Agent backend.',
        );
      }

      setSessionId(returnedSession.id);

      localStorage.setItem(
        'ai-agent-session-id',
        returnedSession.id,
      );

      let returnedMessages: ChatMessage[] = [];

      if (Array.isArray(returnedSession.messages)) {
        returnedMessages = returnedSession.messages;
      } else {
        returnedMessages = [
          userMessage,
          ...(data.assistantMessage
            ? [data.assistantMessage]
            : []),
        ];
      }

      setMessages(
        returnedMessages.length > 0
          ? normalizeMessages(returnedMessages)
          : [userMessage],
      );

      void refreshSessions().catch(() => {
        setSessionError(
          'The conversation was saved, but the list could not be refreshed.',
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown request error.';

      const errorChatMessage = normalizeMessages([
        createTextMessage(
          'assistant',
          `Unable to contact the AI Agent backend.\n\n**${errorMessage}**`,
        ),
      ])[0];

      setMessages((current) => [
        ...current,
        errorChatMessage,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateConfirmation = (
    messageId: string,
    status: 'confirmed' | 'cancelled',
  ) => {
    setMessages((current) =>
      current.map((message): ChatMessage => {
        if (
          message.id !== messageId ||
          message.type !== 'confirmation'
        ) {
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

  return (
    <DashboardLayout>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1400,
          mx: 'auto',
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700 }}
        >
          AI Agent
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.5, mb: 3 }}
        >
          Ask questions and analyse your supply-chain data.
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: 'stretch' }}
        >
          <Paper
            variant="outlined"
            sx={{
              width: {
                xs: '100%',
                md: 290,
              },
              flexShrink: 0,
              p: 1.5,
              minHeight: {
                md: 620,
              },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              disabled={loading}
              onClick={handleNewConversation}
            >
              New conversation
            </Button>

            <Typography
              variant="overline"
              color="text.secondary"
              sx={{
                display: 'block',
                mt: 2,
                px: 1,
              }}
            >
              Conversations
            </Typography>

            {sessionError && (
              <Typography
                variant="caption"
                color="error"
                sx={{
                  display: 'block',
                  px: 1,
                  mb: 1,
                }}
              >
                {sessionError}
              </Typography>
            )}

            <Box
              sx={{
                maxHeight: {
                  xs: 220,
                  md: 510,
                },
                overflowY: 'auto',
              }}
            >
              {loadingSessions && sessions.length === 0 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 3,
                  }}
                >
                  <CircularProgress size={18} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Loading...
                  </Typography>
                </Stack>
              ) : sessions.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    px: 1,
                    py: 2,
                  }}
                >
                  No saved conversations yet.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {sessions.map((session) => {
                    const date = new Date(
                      session.updatedAt,
                    );

                    const updatedAt = Number.isNaN(
                      date.getTime(),
                    )
                      ? ''
                      : date.toLocaleString();

                    return (
                      <ListItem
                        key={session.id}
                        disablePadding
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            aria-label="Delete conversation"
                            title="Delete conversation"
                            disabled={
                              loading ||
                              Boolean(loadingSessionId) ||
                              Boolean(deletingSessionId)
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(session);
                            }}
                          >
                            {deletingSessionId ===
                            session.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        }
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemButton
                          selected={
                            session.id === sessionId
                          }
                          disabled={
                            loading ||
                            Boolean(loadingSessionId) ||
                            Boolean(deletingSessionId)
                          }
                          onClick={() =>
                            void handleSelectSession(
                              session.id,
                            )
                          }
                          sx={{
                            borderRadius: 1.5,
                            alignItems: 'flex-start',
                            pr: 6,
                          }}
                        >
                          <ListItemText
                            primary={
                              session.title ||
                              'Untitled conversation'
                            }
                            secondary={`${session.messages?.length ?? session.messageCount ?? 0} messages${
                              updatedAt
                                ? ` · ${updatedAt}`
                                : ''
                            }`}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: {
                  xs: 2,
                  md: 3,
                },
                minHeight: 520,
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
                backgroundColor: '#f8fafc',
              }}
            >
              {loadingSessionId ? (
                <Stack
                  spacing={1.5}
                  sx={{
                    minHeight: 450,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={28} />

                  <Typography color="text.secondary">
                    Loading conversation...
                  </Typography>
                </Stack>
              ) : (
                <ChatMessageList
                  messages={messages}
                  onConfirm={(id) =>
                    updateConfirmation(
                      id,
                      'confirmed',
                    )
                  }
                  onCancel={(id) =>
                    updateConfirmation(
                      id,
                      'cancelled',
                    )
                  }
                />
              )}
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mt: 2,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{
                  alignItems: 'flex-end',
                }}
              >
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 150,
                    width: {
                      xs: '100%',
                      sm: 'auto',
                    },
                  }}
                  disabled={
                    loading || Boolean(loadingSessionId)
                  }
                >
                  <InputLabel id="ai-provider-label">
                    Model
                  </InputLabel>

                  <Select
                    labelId="ai-provider-label"
                    value={selectedProvider}
                    label="Model"
                    onChange={handleProviderChange}
                  >
                    {AI_PROVIDERS.map((provider) => (
                      <MenuItem
                        key={provider.value}
                        value={provider.value}
                      >
                        {provider.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  disabled={
                    loading ||
                    Boolean(loadingSessionId)
                  }
                  placeholder="Ask about companies, orders or relationships..."
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />

                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  disabled={
                    loading ||
                    Boolean(loadingSessionId) ||
                    !input.trim()
                  }
                  onClick={() => void handleSend()}
                  sx={{
                    minWidth: 110,
                    height: 56,
                  }}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>

        <Dialog
          open={Boolean(deleteTarget)}
          onClose={() => {
            if (!deletingSessionId) {
              setDeleteTarget(null);
            }
          }}
        >
          <DialogTitle>
            Delete conversation?
          </DialogTitle>

          <DialogContent>
            <DialogContentText>
              Delete “
              {deleteTarget?.title ||
                'Untitled conversation'}
              ”? All messages in this conversation will be
              permanently removed.
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button
              disabled={Boolean(deletingSessionId)}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>

            <Button
              color="error"
              variant="contained"
              disabled={Boolean(deletingSessionId)}
              onClick={() =>
                void handleDeleteSession()
              }
            >
              {deletingSessionId
                ? 'Deleting...'
                : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}