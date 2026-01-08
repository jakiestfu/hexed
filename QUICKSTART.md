# Hexed - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install pnpm (if needed)

```bash
npm install -g pnpm
```

### Step 2: Install Dependencies

```bash
cd hexed
pnpm install
```

### Step 3: Start the Dev Server

```bash
pnpm dev
```

### Step 4: Open Your Browser

Navigate to: `http://localhost:3000`

## 🎯 Try It Out

### Example 1: Watch a System Binary

1. In the Hexed UI, enter: `/usr/bin/ls`
2. Click "Open File"
3. Explore the hex view of the `ls` command

### Example 2: Watch a Custom File

```bash
# In a terminal, create a test file
echo -n "Hello World" > /tmp/test.bin

# In Hexed, enter: /tmp/test.bin
# Click "Open File"

# In the terminal, modify the file
echo -n "Hello Hexed!" > /tmp/test.bin

# Watch the "Change 1" tab appear automatically!
```

### Example 3: Create Multiple Changes

```bash
# Create initial file
echo -n "Version 1" > /tmp/demo.bin

# Open in Hexed: /tmp/demo.bin

# Make several changes
echo -n "Version 2" > /tmp/demo.bin
sleep 1
echo -n "Version 3" > /tmp/demo.bin
sleep 1
echo -n "Version 4 - Final" > /tmp/demo.bin

# You'll see tabs: Baseline, Change 1, Change 2, Change 3
```

## 🎨 Features to Try

### Toggle Diff Mode

1. After making a change, you'll see a "Show Diff" button
2. Click it to see **inline highlighting**:
   - 🟢 Green = Added bytes
   - 🔴 Red = Removed bytes
   - 🟡 Yellow = Modified bytes
3. Click again for **side-by-side comparison**
4. Click once more to turn off diff mode

### Toggle ASCII View

- Click the eye icon to hide/show ASCII column
- Useful for focusing on hex values only

### View Diff Statistics

When in diff mode, see cards showing:

- Number of bytes added
- Number of bytes removed
- Number of bytes modified

### Navigate Between Changes

- Click any tab to view that snapshot
- Compare any two consecutive changes
- All previous states are preserved (in memory)

## 📊 What You're Seeing

### Hex Editor Layout

```
Address    Hex Bytes (16 per row)              ASCII
0x00000000 48 65 6C 6C 6F 20 57 6F 72 6C 64    Hello World
```

### Connection Status

- 🟢 Green dot = Connected and watching
- 🔴 Red dot = Disconnected

## 💡 Tips

1. **File Paths**: Must be absolute paths (e.g., `/tmp/file.bin`, not `./file.bin`)
2. **Permissions**: The server must have read access to the file
3. **File Size**: Works best with files under 10MB
4. **Changes**: File must actually change (modification time)
5. **Close**: Click the "Close" button to select a different file

## 🐛 Troubleshooting

### "File not found" error

- Check that the path is correct and absolute
- Ensure the file exists on the server filesystem
- Verify the server has read permissions

### No changes detected

- Ensure the file is actually being modified
- Check that the file's modification time changes
- Try `touch <file>` to update modification time

### Port 3000 already in use

```bash
PORT=3001 pnpm dev
```

### Connection lost

- The UI will show a red dot
- SSE will automatically attempt to reconnect
- Check that the dev server is still running

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `ARCHITECTURE.md` to understand how it works
- See `CONTRIBUTING.md` to add features
- Review `SETUP.md` for detailed setup info

## 🎉 Have Fun!

You're now ready to inspect binary files like a pro! Try watching different files:

- System binaries (`/usr/bin/*`)
- Your own compiled programs
- Image files
- Any binary data format you're working with

Happy inspecting! 🔍
