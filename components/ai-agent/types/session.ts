import type { ChatMessage } from './message';

export type ChatSessionStatus = 'active' | 'archived';

export interface ChatSession {
  id: string;
  title: string;
  status: ChatSessionStatus;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
