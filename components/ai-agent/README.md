# AI Agent frontend

The AI Agent UI renders persistent backend sessions in either an embedded page
or a floating dialog. It keeps API payload validation separate from visual
renderers so malformed or older messages cannot directly enter component
state.

## Code map

| Path | Responsibility |
| --- | --- |
| `ChatWindow.tsx` | Session restore, message submission, provider selection and layout |
| `ChatInput.tsx` | Text entry and attachment selection |
| `ChatMessageList.tsx` | User/assistant message layout |
| `FloatingChatWidget.tsx` | Dialog entry point on authenticated pages |
| `lib/chat-session.ts` | Client message IDs and text-message construction |
| `lib/message-normalizer.ts` | Runtime conversion from unknown API JSON to typed messages |
| `renderers/` | One renderer for each structured message type |
| `types/message.ts` | Discriminated message union shared by the UI |

## Session flow

1. The window becomes visible.
2. The selected provider and latest session ID are read from browser storage.
3. If a session ID exists, the persisted session is fetched with the JWT.
4. API messages are normalized before entering React state.
5. A new user message is shown optimistically and submitted as multipart form
   data.
6. The returned backend session replaces local history because PostgreSQL is
   the source of truth.

A failed restore removes the stale session ID but does not remove the user's
authentication token.

## API boundary

All routes use `apiUrl()` from `lib/api.ts`, which reads
`NEXT_PUBLIC_API_URL` and removes trailing slashes. Authenticated AI requests
read `accessToken` at request time and send it as a bearer token.

The normalizer accepts both current structured messages and earlier compatible
payload shapes. Unknown message types safely fall back to text.

## Message types

| Type | Renderer |
| --- | --- |
| `text` | Markdown with GitHub-flavoured Markdown support |
| `table` | Responsive Material UI table |
| `chart` | Bar, line or pie chart |
| `report` | Report status and optional download action |
| `confirmation` | Confirm/cancel prompt with local status feedback |

## Attachments

The input accepts at most five files per message. Only attachment metadata is
added to the optimistic user message; the actual `File` objects are sent in
the multipart request. The backend decides which file contents can be read.

## Current milestone limits

- The `Agent Tasks` page contains demo rows only.
- Confirmation buttons update the visible message state but do not yet execute
  an external operation.
- The latest session ID is stored per browser profile, not per open tab.

## Validation

```bash
npm run lint
npm run build
```

Manual checks should cover embedded and floating layouts, restored history,
provider changes, file-only messages and every structured renderer.

