'use client';

import ChartMessageRenderer from './ChartMessageRenderer';
import ConfirmationMessageRenderer from './ConfirmationMessageRenderer';
import ReportMessageRenderer from './ReportMessageRenderer';
import TableMessageRenderer from './TableMessageRenderer';
import TextMessageRenderer from './TextMessageRenderer';

import type { ChatMessage } from '../types';

interface MessageRendererProps {
  message: ChatMessage;
  onConfirm?: (messageId: string) => void;
  onCancel?: (messageId: string) => void;
}

export default function MessageRenderer({
  message,
  onConfirm,
  onCancel,
}: MessageRendererProps) {
  switch (message.type) {
    case 'text':
      return <TextMessageRenderer content={message.content} />;

    case 'table':
      return <TableMessageRenderer content={message.content} />;

    case 'chart':
      return <ChartMessageRenderer content={message.content} />;

    case 'report':
      return <ReportMessageRenderer content={message.content} />;

    case 'confirmation':
      return (
        <ConfirmationMessageRenderer
          content={message.content}
          onConfirm={
            onConfirm ? () => onConfirm(message.id) : undefined
          }
          onCancel={onCancel ? () => onCancel(message.id) : undefined}
        />
      );
  }
}
