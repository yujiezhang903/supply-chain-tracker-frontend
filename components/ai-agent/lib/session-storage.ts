import type { ChatSession } from '../types';

const STORAGE_KEY = 'supply-chain-tracker:ai-agent-session';

function isChatSession(value: unknown): value is ChatSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<ChatSession>;

  return (
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    (session.status === 'active' || session.status === 'archived') &&
    Array.isArray(session.messages) &&
    typeof session.createdAt === 'string' &&
    typeof session.updatedAt === 'string'
  );
}

export function loadChatSession(): ChatSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedSession = window.localStorage.getItem(STORAGE_KEY);

    if (!storedSession) {
      return null;
    }

    const parsedSession: unknown = JSON.parse(storedSession);

    return isChatSession(parsedSession) ? parsedSession : null;
  } catch {
    return null;
  }
}

export function saveChatSession(session: ChatSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearChatSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
