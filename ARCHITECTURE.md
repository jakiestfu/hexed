# Binspector Architecture

## Overview

Binspector is a monorepo application built with TanStack Start that provides real-time hex editing and binary file inspection with change tracking.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React UI (TanStack Start Client)                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │ │
│  │  │ Empty    │  │ Hex      │  │ Tabs System          │ │ │
│  │  │ State    │  │ Editor   │  │ (Baseline, Changes)  │ │ │
│  │  └──────────┘  └──────────┘  └──────────────────────┘ │ │
│  │         │            │                 │               │ │
│  │         └────────────┴─────────────────┘               │ │
│  │                      │                                  │ │
│  │              ┌───────▼────────┐                        │ │
│  │              │ useFileWatcher │                        │ │
│  │              │  (SSE Client)  │                        │ │
│  │              └───────┬────────┘                        │ │
│  └──────────────────────┼─────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
                   EventSource (SSE)
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Server (Node.js)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TanStack Start Server                                 │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  /api/watch Endpoint (SSE)                       │ │ │
│  │  │  ┌────────────┐  ┌──────────────┐  ┌──────────┐ │ │ │
│  │  │  │ Chokidar   │→ │ File Parser  │→ │ Storage  │ │ │ │
│  │  │  │ Watcher    │  │ (binary)     │  │ Adapter  │ │ │ │
│  │  │  └────────────┘  └──────────────┘  └──────────┘ │ │ │
│  │  │         │                │                │       │ │ │
│  │  │         └────────────────┴────────────────┘       │ │ │
│  │  │                      │                            │ │ │
│  │  │              ┌───────▼────────┐                  │ │ │
│  │  │              │ SSE Stream     │                  │ │ │
│  │  │              │ (push updates) │                  │ │ │
│  │  │              └────────────────┘                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Filesystem    │
                  │ (Binary File) │
                  └───────────────┘
```

## Monorepo Structure

### Packages

#### `@binspector/types`
Core TypeScript type definitions shared across the entire application.

**Key Types:**
- `BinarySnapshot`: Represents a file state at a point in time
- `ByteDiff`: Individual byte change information
- `DiffResult`: Complete diff between two snapshots
- `SnapshotStorage`: Storage adapter interface
- `SSEMessage`: Server-sent event message structure

#### `@binspector/binary-utils`
Binary file processing utilities.

**Modules:**
- **parser.ts**: Read binary files into `Uint8Array`
- **differ.ts**: Compute byte-by-byte differences between snapshots
- **formatter.ts**: Format bytes as hex/ASCII for display
- **storage.ts**: Storage adapter implementation (in-memory by default)

#### `@binspector/ui`
Reusable UI components built with shadcn/ui and Tailwind v4.

**Components:**
- Button, Card, Tabs, Toggle
- Follows Radix UI primitives
- Fully typed and styled with Tailwind

### Apps

#### `web`
TanStack Start application serving the UI and API.

**Structure:**
```
app/
├── routes/
│   ├── __root.tsx       # Root layout with header
│   ├── index.tsx        # Main page with file selection & hex editor
│   └── api/
│       └── watch.ts     # SSE endpoint for file watching
├── components/
│   ├── empty-state.tsx  # Initial file selection UI
│   ├── hex-editor.tsx   # Main hex editor with diff modes
│   ├── diff-viewer.tsx  # Diff statistics cards
│   └── ascii-view.tsx   # ASCII representation component
└── utils/
    └── use-file-watcher.ts  # React hook for SSE connection
```

## Data Flow

### 1. File Selection
```
User enters file path
    ↓
EmptyState component
    ↓
Sets selectedFile state
    ↓
Triggers useFileWatcher hook
```

### 2. Initial Load
```
useFileWatcher creates EventSource
    ↓
Connects to /api/watch?file=<path>
    ↓
Server reads file with readBinaryFile()
    ↓
Creates baseline snapshot (index 0)
    ↓
Stores in SnapshotStorage
    ↓
Sends snapshot via SSE
    ↓
Client receives and adds to snapshots array
    ↓
Renders first tab: "Baseline"
```

### 3. File Change Detection
```
File changes on disk
    ↓
Chokidar detects 'change' event
    ↓
Server reads updated file
    ↓
Creates new snapshot (index++)
    ↓
Computes diff vs previous snapshot
    ↓
Stores snapshot
    ↓
Sends snapshot via SSE
    ↓
Client adds new tab: "Change N"
    ↓
User can toggle diff view
```

### 4. Diff Visualization

**Inline Mode:**
- Shows current snapshot
- Highlights changed bytes with colors:
  - Green: Added bytes
  - Red: Removed bytes
  - Yellow: Modified bytes

**Side-by-Side Mode:**
- Left panel: Previous snapshot
- Right panel: Current snapshot with highlights
- Easy comparison of before/after

## Storage Adapter Pattern

The storage system uses dependency injection for flexibility:

```typescript
interface SnapshotStorage {
  save(fileId: string, snapshot: BinarySnapshot): Promise<void>;
  getSnapshots(fileId: string): Promise<BinarySnapshot[]>;
  clear(fileId: string): Promise<void>;
}
```

**Current Implementation:** `InMemoryStorage`
- Stores snapshots in a `Map<string, BinarySnapshot[]>`
- Fast, no persistence
- Cleared on server restart

**Future Implementations:**
- `IndexedDBStorage`: Browser persistence
- `FilesystemStorage`: Server-side persistence
- `DatabaseStorage`: PostgreSQL/MongoDB for multi-user scenarios

## Real-time Communication

### Server-Sent Events (SSE)

**Why SSE over WebSockets?**
- Simpler protocol (HTTP-based)
- Automatic reconnection
- One-way communication is sufficient
- Lower overhead

**Message Types:**
1. **connected**: Initial connection established
2. **snapshot**: New file snapshot available
3. **error**: Error occurred (file not found, permission denied, etc.)
4. **disconnected**: Connection closed

**SSE Message Format:**
```
data: {"type":"snapshot","data":{...},"timestamp":1234567890}

```

## UI Components

### HexEditor Component

**Responsibilities:**
- Display binary data in hex format
- Show parallel ASCII view
- Highlight diffs when in diff mode
- Support scrolling for large files
- Toggle ASCII view on/off

**Props:**
```typescript
{
  snapshot: BinarySnapshot;
  previousSnapshot?: BinarySnapshot;
}
```

**Features:**
- 16 bytes per row (standard hex editor layout)
- Address column (offset in hex)
- Hex bytes with spacing
- ASCII view (printable chars, '.' for non-printable)
- Hover tooltips showing offset and byte value

### Tab System

Built with Radix UI Tabs:
- Baseline tab (index 0)
- Change N tabs (index 1+)
- Automatic tab creation on new snapshots
- Active tab state management

## Performance Considerations

1. **Large Files**: 
   - Virtualization not yet implemented
   - Consider adding react-window for files >1MB
   
2. **Many Changes**:
   - In-memory storage may grow large
   - Consider snapshot limits or circular buffer
   
3. **Diff Computation**:
   - O(n) where n = file size
   - Computed on-demand, memoized in React
   
4. **SSE Connection**:
   - Single connection per file watch
   - Automatic reconnection on disconnect

## Error Handling

### Server-side
- File not found → SSE error message
- Permission denied → SSE error message
- File watcher errors → SSE error message

### Client-side
- Connection lost → Shows red indicator, attempts reconnect
- Parse errors → Console error, UI shows error state
- Invalid file path → Server sends error, UI displays

## Security Considerations

**Current State (Development):**
- No authentication
- Direct filesystem access
- Client can watch any file server can read

**Production Recommendations:**
- Add authentication/authorization
- Whitelist allowed directories
- Rate limiting on SSE connections
- File size limits
- Sanitize file paths (prevent directory traversal)

## Testing Strategy

**Unit Tests:**
- Binary utils (parser, differ, formatter)
- Storage adapter
- React hooks

**Integration Tests:**
- SSE endpoint
- File watcher functionality
- UI component interactions

**E2E Tests:**
- File selection flow
- Change detection
- Diff visualization

## Future Enhancements

1. **Performance**:
   - Virtual scrolling for large files
   - Web Workers for diff computation
   - Chunked loading for huge files

2. **Features**:
   - Byte editing
   - Search/find functionality
   - Annotations and bookmarks
   - Export snapshot history
   - Multiple file comparison

3. **Storage**:
   - Persistent storage option
   - Snapshot compression
   - Export/import snapshots

4. **UI**:
   - Dark/light mode toggle
   - Customizable color schemes
   - Font size adjustment
   - Jump to address

