# Hexed

A modern hex editor for inspecting and tracking binary file changes in real-time.

## Features

- **Real-time File Watching**: Automatically detects and displays changes to binary files
- **Hex Editor View**: Clean hex display with parallel ASCII view
- **Change Tracking**: Snapshots every change with tabs (Baseline, Change 1, Change 2, etc.)
- **Diff Visualization**:
  - Inline mode: Highlights changes in the current view
  - Side-by-side mode: Compare previous and current versions
- **Modern UI**: Built with shadcn/ui and Tailwind CSS v4
- **Extensible Storage**: Adapter pattern for easy storage backend switching

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Framework**: TanStack Start (latest) with React 19
- **UI**: shadcn/ui + Tailwind CSS v4
- **Real-time**: Server-Sent Events (SSE)
- **File Watching**: chokidar
- **TypeScript**: Fully typed

## Project Structure

```
hexed/
├── apps/
│   └── web/                    # TanStack Start app
│       ├── app/
│       │   ├── routes/         # Routes and API endpoints
│       │   ├── components/     # UI components
│       │   └── utils/          # Utilities (SSE client, etc.)
│       └── package.json
└── packages/
    ├── ui/                     # Shared UI components (shadcn)
    ├── binary-utils/           # Binary parsing, diffing, formatting
    └── types/                  # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

### Usage

1. Open the app in your browser
2. Enter the full path to a binary file on your server's filesystem
3. Click "Open File" to start watching
4. The file will be displayed in hex editor view
5. Any changes to the file will automatically create new tabs
6. Use the diff toggle to compare changes

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check all packages
pnpm typecheck
```

## Architecture

### Storage Adapter Pattern

The storage system uses an adapter pattern for flexibility:

```typescript
interface SnapshotStorage {
  save(fileId: string, snapshot: BinarySnapshot): Promise<void>;
  getSnapshots(fileId: string): Promise<BinarySnapshot[]>;
  clear(fileId: string): Promise<void>;
}
```

Currently uses in-memory storage, but can be easily swapped for:

- IndexedDB (browser persistence)
- Filesystem (server-side persistence)
- Database (PostgreSQL, MongoDB, etc.)

### Real-time Updates

Uses Server-Sent Events (SSE) for one-way communication:

1. Client connects to `/api/watch?file=<path>`
2. Server watches file with chokidar
3. On change, server sends snapshot via SSE
4. Client updates UI with new tab

## Future Enhancements

- [ ] Byte editing
- [ ] Search functionality (find bytes/patterns)
- [ ] Go to address/offset
- [ ] Export snapshot history
- [ ] Persistent storage (IndexedDB)
- [ ] File upload (watch uploaded files)
- [ ] Annotations and bookmarks
- [ ] Multiple file comparison

## License

ISC
