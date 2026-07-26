import type {
  ChatAttachment,
  ChatMessage,
  ChatRole,
  ChatSession,
} from '../types';

function createId(prefix: 'session' | 'message'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }

  return (
    prefix +
    '-' +
    Date.now() +
    '-' +
    Math.random().toString(36).slice(2)
  );
}

export function createMessageId(): string {
  return createId('message');
}

export function createTextMessage(
  role: ChatRole,
  markdown: string,
  attachments?: ChatAttachment[],
): ChatMessage {
  const message: ChatMessage = {
    id: createMessageId(),
    role,
    type: 'text',
    content: { markdown },
    createdAt: new Date().toISOString(),
  };

  if (attachments?.length) {
    message.attachments = attachments;
  }

  return message;
}

export function createInitialSession(): ChatSession {
  const now = new Date().toISOString();

  return {
    id: createId('session'),
    title: 'New conversation',
    status: 'active',
    messages: [
      createTextMessage(
        'assistant',
        'Hello! How can I help with your supply-chain work today?',
      ),
    ],
    createdAt: now,
    updatedAt: now,
  };
}
