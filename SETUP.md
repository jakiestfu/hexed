# Setup Instructions

## Quick Start

1. **Install pnpm** (if not already installed):

```bash
npm install -g pnpm
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

2. **Install dependencies**:

```bash
pnpm install
```

3. **Start the development server**:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## First Time Setup

After starting the dev server:

1. Open your browser to `http://localhost:3000`
2. You'll see an empty state asking you to select a file
3. Enter the full path to a binary file on your server (e.g., `/usr/bin/ls`)
4. Click "Open File"
5. The hex editor will display the file contents
6. Make changes to the file to see new tabs appear automatically

## Testing File Changes

To test the file watching feature:

```bash
# Create a test binary file
echo -n "Hello World" > /tmp/test.bin

# Open this file in Binspector: /tmp/test.bin

# In another terminal, modify the file
echo -n "Hello Binspector!" > /tmp/test.bin

# Watch as a new "Change 1" tab appears in the UI
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it by setting the PORT environment variable:

```bash
PORT=3001 pnpm dev
```

### Module Not Found Errors

If you see module resolution errors, try:

```bash
# Clean install
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

Run type checking across all packages:

```bash
pnpm typecheck
```

## Package Management

This is a pnpm workspace. To add dependencies:

```bash
# Add to root
pnpm add -w <package>

# Add to specific workspace
pnpm --filter web add <package>
pnpm --filter @binspector/ui add <package>
```

## Development Tips

- The SSE connection will automatically reconnect if lost
- File paths must be absolute and accessible by the server
- Large files (>10MB) may take a moment to load
- The hex editor is scrollable for large files
- Use the diff toggle to compare changes between snapshots

