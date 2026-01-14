# Hexed Web App

A React application for Hexed - a modern hex editor for inspecting and tracking binary file changes.

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The build will generate a static site in the `dist/` directory that can be served by any static file server.

## Components

- `empty-state.tsx`: Initial state prompting file selection
- `hex-editor.tsx`: Main hex editor with ASCII view and diff modes
- `diff-viewer.tsx`: Statistics card showing change counts
- `ascii-view.tsx`: ASCII representation of bytes
