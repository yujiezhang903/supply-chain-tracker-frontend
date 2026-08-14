# Supply Chain Tracker Frontend

Next.js dashboard for managing supply-chain companies, relationships, orders,
users and AI-assisted analysis.

The API is maintained in
[supply-chain-tracker-backend](https://github.com/yujiezhang903/supply-chain-tracker-backend).

## Main pages

| Route | Purpose |
| --- | --- |
| `/login` and `/signup` | Authentication |
| `/dashboard` | Supply-chain metrics and visual analysis |
| `/company` | Searchable, filterable company table |
| `/order` | Order management |
| `/user` | User management |
| `/ai-agent` | Persistent AI Agent conversation |
| `/agent-tasks` | Task-interface preview for a later orchestration milestone |

Authenticated dashboard pages use the shared layout in
`components/layout/DashboardLayout.tsx`. AI rendering and session behavior are
documented in [components/ai-agent/README.md](components/ai-agent/README.md).

## Technology

- Node.js 22+
- Next.js 16.2.7 and React 19
- Material UI 9
- Chart.js and D3
- TypeScript and ESLint

## Local setup

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create a local environment file.

   ```bash
   cp .env.example .env.local
   ```

3. Start the backend on port 3001, or change `NEXT_PUBLIC_API_URL` to the
   correct API origin.

4. Start the frontend.

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`.

## Configuration

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

All frontend requests build their URL through `lib/api.ts`. Keep the value as
an origin without a route suffix. A trailing slash is accepted and normalized.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with webpack |
| `npm run build` | Create a production build |
| `npm run start` | Start a production build |
| `npm run lint` | Run ESLint |

## AI Agent behavior

The AI window is available as a full page and as a floating dialog on
authenticated pages. It:

- restores the last backend session when opened;
- stores the selected model provider and session ID in browser storage;
- sends text and up to five attached files as multipart form data;
- normalizes API messages into text, table, chart, report or confirmation
  renderers;
- treats the backend session response as the authoritative message history.

The `Agent Tasks` page is currently a visual preview. It does not yet execute
LangGraph tasks.

## Validation before delivery

```bash
npm run lint
npm run build
```

Also verify login, the company/dashboard pages, a restored AI conversation and
a file-only AI message against a running backend.

## Repository hygiene

Generated output, dependencies, local environment files and temporary backup
copies are ignored. Use Git history instead of committing `.before-*`,
`.backup` or `.bak` files.

