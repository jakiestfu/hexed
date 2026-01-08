# Desktop App

Electron wrapper for the Hexed hex editor web application.

## Development

1. Start the Next.js web app in development mode:
   ```bash
   pnpm dev
   ```

2. In a separate terminal, start the Electron app:
   ```bash
   pnpm dev:desktop
   ```

The Electron app will load the Next.js app running at `http://localhost:3000`.

## Building

Build the Electron app:
```bash
pnpm build:desktop
```

The compiled files will be in the `dist/` directory.

## Features

- Frameless window with macOS traffic lights only
- Draggable toolbar
- Native file picker when selecting files (Electron only)
- Works seamlessly with the web version

