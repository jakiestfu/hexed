# Hexed Web App

A static Next.js application for Hexed - a modern hex editor for inspecting and tracking binary file changes.

## Development

```bash
# Start dev server
pnpm dev

# Build static site
pnpm build
```

The build will generate a fully static site in the `out/` directory that can be served by any static file server.

## Components

- `empty-state.tsx`: Initial state prompting file selection
- `hex-editor.tsx`: Main hex editor with ASCII view and diff modes
- `diff-viewer.tsx`: Statistics card showing change counts
- `ascii-view.tsx`: ASCII representation of bytes
