# Hexed Web App

The main TanStack Start application for Hexed.

## Development

```bash
# Start dev server
pnpm dev

# Build
pnpm build

# Start production
pnpm start
```

## API Routes

### `/api/watch`

SSE endpoint for watching binary file changes.

**Query Parameters:**

- `file` (required): Full path to the file to watch

**Response:**
Server-Sent Events stream with JSON messages:

```typescript
{
  type: 'connected' | 'snapshot' | 'error' | 'disconnected',
  data?: BinarySnapshot,
  error?: string,
  timestamp: number
}
```

## Components

- `empty-state.tsx`: Initial state prompting file selection
- `hex-editor.tsx`: Main hex editor with ASCII view and diff modes
- `diff-viewer.tsx`: Statistics card showing change counts
- `ascii-view.tsx`: ASCII representation of bytes

## Utilities

- `use-file-watcher.ts`: React hook for SSE connection and state management
