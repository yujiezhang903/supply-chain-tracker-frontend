import type {
  ChatAttachment,
  ChatMessage,
  ChatRole,
} from '../types';

function createMessageId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return 'message-' + crypto.randomUUID();
  }

  return (
    'message-' +
    Date.now() +
    '-' +
    Math.random().toString(36).slice(2)
  );
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

