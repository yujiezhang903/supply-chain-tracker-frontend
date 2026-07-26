export type ChatRole = 'user' | 'assistant';

export type ChatMessageType =
  | 'text'
  | 'table'
  | 'chart'
  | 'report'
  | 'confirmation';

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface TextMessageContent {
  markdown: string;
}

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableMessageContent {
  title?: string;
  columns: TableColumn[];
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface ChartMessageContent {
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKeys: string[];
}

export interface ReportMessageContent {
  title: string;
  summary: string;
  status?: 'generating' | 'ready' | 'failed';
  fileName?: string;
  downloadUrl?: string;
}

export interface ConfirmationMessageContent {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface ChatMessageContentMap {
  text: TextMessageContent;
  table: TableMessageContent;
  chart: ChartMessageContent;
  report: ReportMessageContent;
  confirmation: ConfirmationMessageContent;
}

interface ChatMessageBase {
  id: string;
  role: ChatRole;
  createdAt: string;
  attachments?: ChatAttachment[];
}

export type ChatMessage = {
  [Type in ChatMessageType]: ChatMessageBase & {
    type: Type;
    content: ChatMessageContentMap[Type];
  };
}[ChatMessageType];
