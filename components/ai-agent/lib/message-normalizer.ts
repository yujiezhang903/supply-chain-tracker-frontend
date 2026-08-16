import type {
  ChatAttachment,
  ChatMessage,
  ChatMessageType,
} from '../types';

type JsonRecord = Record<string, unknown>;
type CellValue = string | number | boolean | null;

function asRecord(value: unknown): JsonRecord {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }

  return {};
}

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toCellValue(value: unknown): CellValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return JSON.stringify(value);
}

function normalizeAttachments(value: unknown): ChatAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const record = asRecord(item);

    return {
      id: asString(record.id, 'attachment-' + index),
      name: asString(
        record.name ?? record.originalname,
        'Attached file',
      ),
      type: asString(record.type ?? record.mimeType, 'application/octet-stream'),
      size: asNumber(record.size),
    };
  });
}

function baseMessage(
  source: JsonRecord,
  index: number,
): {
  id: string;
  role: 'user' | 'assistant';
  createdAt: string;
  attachments?: ChatAttachment[];
} {
  const attachments = normalizeAttachments(source.attachments);

  return {
    id: asString(source.id, 'message-' + index),
    role: source.role === 'user' ? 'user' : 'assistant',
    createdAt: asString(source.createdAt, new Date().toISOString()),
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

function normalizeTable(
  source: JsonRecord,
  content: JsonRecord,
  index: number,
): ChatMessage {
  const rawColumns = Array.isArray(content.columns)
    ? content.columns
    : [];
  let columns = rawColumns
    .map((item) => {
      const column = asRecord(item);
      const key = asString(column.key);

      return {
        key,
        label: asString(column.label, key),
      };
    })
    .filter((column) => column.key);

  const rawRows = Array.isArray(content.rows) ? content.rows : [];
  const records = rawRows.map((item) => asRecord(item));

  if (columns.length === 0 && records[0]) {
    columns = Object.keys(records[0]).map((key) => ({
      key,
      label: key,
    }));
  }

  const rows = records.map((record) => {
    const row: Record<string, CellValue> = {};

    for (const column of columns) {
      row[column.key] = toCellValue(record[column.key]);
    }

    return row;
  });

  return {
    ...baseMessage(source, index),
    type: 'table',
    content: {
      title: asString(content.title, 'Results'),
      columns,
      rows,
    },
  };
}

function normalizeChart(
  source: JsonRecord,
  content: JsonRecord,
  index: number,
): ChatMessage {
  const chartType =
    content.chartType === 'line' ||
    content.chartType === 'pie'
      ? content.chartType
      : 'bar';
  const rawLabels = Array.isArray(content.labels)
    ? content.labels
    : [];
  const labels = rawLabels.map((label) => asString(label));
  const rawDatasets = Array.isArray(content.datasets)
    ? content.datasets
    : [];

  // Current backend charts use Chart.js-style labels/datasets. The branch
  // below also accepts the earlier row-oriented data/xKey/yKeys shape.
  if (rawDatasets.length > 0) {
    const datasetNames = rawDatasets.map((item, datasetIndex) => {
      const dataset = asRecord(item);
      return asString(dataset.label, 'Series ' + (datasetIndex + 1));
    });

    const data = labels.map((label, labelIndex) => {
      const row: Record<string, string | number> = { label };

      rawDatasets.forEach((item, datasetIndex) => {
        const dataset = asRecord(item);
        const values = Array.isArray(dataset.data)
          ? dataset.data
          : [];
        row[datasetNames[datasetIndex]] = asNumber(values[labelIndex]);
      });

      return row;
    });

    return {
      ...baseMessage(source, index),
      type: 'chart',
      content: {
        title: asString(content.title, 'Chart'),
        chartType,
        data,
        xKey: 'label',
        yKeys: datasetNames,
      },
    };
  }

  const rawData = Array.isArray(content.data)
    ? content.data
    : [];
  const data = rawData.map((item) => {
    const record = asRecord(item);
    const row: Record<string, string | number> = {};

    Object.entries(record).forEach(([key, value]) => {
      if (typeof value === 'number') {
        row[key] = value;
      } else if (typeof value === 'string') {
        row[key] = value;
      } else {
        row[key] = asString(value);
      }
    });

    return row;
  });

  const xKey = asString(content.xKey, 'label');
  const rawYKeys = Array.isArray(content.yKeys)
    ? content.yKeys
    : [];
  const yKeys = rawYKeys.map((key) => asString(key));

  return {
    ...baseMessage(source, index),
    type: 'chart',
    content: {
      title: asString(content.title, 'Chart'),
      chartType,
      data,
      xKey,
      yKeys,
    },
  };
}

function normalizeReport(
  source: JsonRecord,
  content: JsonRecord,
  index: number,
): ChatMessage {
  const rawStatus = asString(content.status);
  const status =
    rawStatus === 'draft' ||
    rawStatus === 'generating' ||
    rawStatus === 'failed'
      ? rawStatus
      : 'ready';

  return {
    ...baseMessage(source, index),
    type: 'report',
    content: {
      title: asString(content.title, 'Report'),
      summary: asString(content.summary),
      status,
      fileName: asString(content.fileName) || undefined,
      downloadUrl:
        asString(content.downloadUrl ?? content.url) || undefined,
    },
  };
}

function normalizeConfirmation(
  source: JsonRecord,
  content: JsonRecord,
  index: number,
): ChatMessage {
  const rawStatus = asString(content.status);
  const status =
    rawStatus === 'confirmed' || rawStatus === 'cancelled'
      ? rawStatus
      : 'pending';
  const rawActions = Array.isArray(content.actions)
    ? content.actions
    : [];
  const actions = rawActions.map((item, actionIndex) => {
    const action = asRecord(item);
    const tone =
      action.tone === 'danger' ||
      action.tone === 'primary'
        ? action.tone
        : 'neutral';

    return {
      id: asString(action.id, 'action-' + actionIndex),
      label: asString(action.label, 'Action'),
      tone,
    };
  });
  const confirmAction =
    actions.find((action) => action.tone === 'primary') ??
    actions[0];
  const cancelAction =
    actions.find((action) => action.tone === 'danger') ??
    actions[1];

  return {
    ...baseMessage(source, index),
    type: 'confirmation',
    content: {
      title: asString(content.title, 'Confirmation'),
      description: asString(content.description),
      confirmLabel: confirmAction?.label ?? 'Confirm',
      cancelLabel: cancelAction?.label ?? 'Cancel',
      status,
    },
  };
}

/**
 * Convert untrusted API JSON into the UI's discriminated message union.
 * Unsupported or incomplete payloads fail safely to a text message.
 */
export function normalizeChatMessage(
  value: unknown,
  index = 0,
): ChatMessage {
  const source = asRecord(value);
  const contentValue = source.content;
  const content =
    typeof contentValue === 'string'
      ? { type: 'text', text: contentValue }
      : asRecord(contentValue);
  const messageType = asString(content.type) as ChatMessageType;

  if (messageType === 'table') {
    return normalizeTable(source, content, index);
  }

  if (messageType === 'chart') {
    return normalizeChart(source, content, index);
  }

  if (messageType === 'report') {
    return normalizeReport(source, content, index);
  }

  if (messageType === 'confirmation') {
    return normalizeConfirmation(source, content, index);
  }

  const markdown = asString(
    content.markdown ?? content.text ?? source.text,
    'No response content.',
  );

  return {
    ...baseMessage(source, index),
    type: 'text',
    content: { markdown },
  };
}

export function normalizeChatMessages(
  values: unknown[],
): ChatMessage[] {
  return values.map((value, index) =>
    normalizeChatMessage(value, index),
  );
}

/** Build optimistic attachment metadata; File bytes stay in FormData. */
export function attachmentsFromFiles(
  files: File[],
): ChatAttachment[] {
  return files.map((file, index) => ({
    id: 'attachment-' + Date.now() + '-' + index,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
  }));
}
