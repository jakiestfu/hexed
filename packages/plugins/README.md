# @hexed/plugins

A plugin system for extending the Hexed hex editor with custom functionality.

## Overview

Plugins allow you to extend the Hexed editor with custom sidebar panels, toolbar items, visualizations, and labels. Each plugin is a React component that receives the current file, editor state, and settings as props.

## Plugin Types

Plugins can be one of four types:

- **`sidebar`** - A panel that appears in the editor sidebar (left or right)
- **`toolbar`** - A toolbar button or control
- **`visualization`** - A custom visualization overlay
- **`label`** - A label or annotation

## Creating a Plugin

### Step 1: Create Your Plugin Component

Create a React component that implements the `HexedPluginComponent` type:

```tsx
import { SomeIcon } from "lucide-react"

import { HexedPluginComponent } from "@hexed/plugins/types"

export const MyPlugin: HexedPluginComponent = ({ file, state, settings }) => {
  // Access the current file
  const fileSize = file.size
  const fileData = file.readBytes(0, 100) // Read first 100 bytes

  // Access editor state
  const selectedOffset = state.selectedOffset
  const endianness = state.endianness

  // Access settings
  const sidebarPosition = settings.sidebarPosition

  // Your plugin UI here
  return (
    <div className="p-4">
      <h2>My Plugin</h2>
      <p>File size: {fileSize} bytes</p>
      {selectedOffset !== null && <p>Selected offset: {selectedOffset}</p>}
    </div>
  )
}
```

### Step 2: Create the Plugin Definition

Use `createHexedEditorPlugin` to create your plugin definition:

```tsx
import { SomeIcon } from "lucide-react"

import { createHexedEditorPlugin } from "@hexed/plugins"

import { MyPlugin } from "./my-plugin"

export const myPlugin = createHexedEditorPlugin({
  type: "sidebar",
  id: "my-plugin",
  title: "My Plugin",
  icon: SomeIcon,
  component: MyPlugin,
  // Optional: custom hotkey
  hotkey: {
    formatted: "⌘4", // Mac format
    keys: "ctrl+4,meta+4" // Cross-platform format
  }
})
```

### Step 3: Register Your Plugin

Add your plugin to the plugins array in `src/core/index.tsx`:

```tsx
import { pluginsWithHotkeys } from ".."
import { HexedPlugin } from "../types"
import { interpreterPlugin } from "./interpreter"
import { myPlugin } from "./my-plugin" // Import your plugin
import { stringsPlugin } from "./strings"
import { templatesPlugin } from "./templates"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  myPlugin // Add your plugin here
])
```

## Plugin Component Props

Your plugin component receives the following props:

### `file: HexedFile`

The current file being edited. Provides methods to read bytes and access file metadata.

**Common methods:**

- `file.size` - File size in bytes
- `file.readBytes(offset, length)` - Read bytes from the file
- `file.readUint8(offset)` - Read an 8-bit unsigned integer
- `file.readUint16(offset, endianness?)` - Read a 16-bit unsigned integer
- `file.getHandle()` - Get the FileSystemFileHandle (if available)

See `@hexed/file` package for full API documentation.

### `state: HexedState`

The current editor state, including selection, view settings, and callbacks.

**Common properties:**

- `state.selectedOffset` - Currently selected byte offset (number | null)
- `state.selectedOffsetRange` - Selected byte range ({ start: number, end: number } | null)
- `state.endianness` - Current endianness ("le" | "be")
- `state.numberFormat` - Number format ("dec" | "hex")
- `state.handleScrollToOffset(offset)` - Scroll to a specific offset
- `state.setSelectedOffsetRange(range)` - Set the selected byte range

**Example:**

```tsx
const MyPlugin: HexedPluginComponent = ({ file, state }) => {
  const handleClick = () => {
    // Scroll to offset 0x100
    state.handleScrollToOffset(0x100)

    // Select bytes 0x100-0x10F
    state.setSelectedOffsetRange({ start: 0x100, end: 0x10f })
  }

  return <button onClick={handleClick}>Go to 0x100</button>
}
```

### `settings: UseHexedSettings`

Editor settings and preferences.

**Common properties:**

- `settings.sidebar` - Current sidebar ID ("interpreter" | "strings" | "templates" | null)
- `settings.setSidebar(id)` - Set the active sidebar
- `settings.sidebarPosition` - Sidebar position ("left" | "right")
- `settings.toggleSidebarPosition()` - Toggle sidebar position
- `settings.showAscii` - Whether ASCII view is shown
- `settings.theme` - Current theme

## Plugin Options

When creating a plugin, you provide the following options:

```tsx
type HexedPluginOptions = {
  type: "sidebar" | "toolbar" | "visualization" | "label"
  id: string // Unique plugin identifier
  title: string // Display name
  icon: LucideIcon // Icon component from lucide-react
  component: HexedPluginComponent // Your plugin component
  hotkey?: {
    // Optional keyboard shortcut
    formatted: string // Display format (e.g., "⌘4")
    keys: string // Key combination (e.g., "ctrl+4,meta+4")
  }
}
```

### Automatic Hotkeys

If you don't provide a `hotkey` for a sidebar plugin, one will be automatically assigned:

- First sidebar plugin: ⌘1 / Ctrl+1
- Second sidebar plugin: ⌘2 / Ctrl+2
- And so on...

## Complete Example

Here's a complete example of a simple plugin that displays file statistics:

```tsx
// src/core/file-stats.tsx
import { FileText } from "lucide-react"

import { formatAddress } from "@hexed/file/formatter"

import { createHexedEditorPlugin } from "../index"
import { HexedPluginComponent } from "../types"

const FileStats: HexedPluginComponent = ({ file, state }) => {
  const fileSize = file.size
  const selectedOffset = state.selectedOffset

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">File Information</h3>
        <div className="space-y-1 text-sm">
          <div>Size: {fileSize.toLocaleString()} bytes</div>
          <div>Size (hex): {formatAddress(fileSize)}</div>
        </div>
      </div>

      {selectedOffset !== null && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Selection</h3>
          <div className="space-y-1 text-sm">
            <div>Offset: {formatAddress(selectedOffset)}</div>
            <div>Decimal: {selectedOffset.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export const fileStatsPlugin = createHexedEditorPlugin({
  type: "sidebar",
  id: "file-stats",
  title: "File Stats",
  icon: FileText,
  component: FileStats
})
```

Then register it in `src/core/index.tsx`:

```tsx
import { fileStatsPlugin } from "./file-stats"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  fileStatsPlugin // Add your plugin
])
```

## Using UI Components

Plugins can use components from `@hexed/ui` for consistent styling:

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@hexed/ui"

const MyPlugin: HexedPluginComponent = ({ file, state }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Plugin</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => state.handleScrollToOffset(0)}>
          Go to Start
        </Button>
      </CardContent>
    </Card>
  )
}
```

## Accessing Worker Services

If your plugin needs to perform heavy computations, you can use the worker client:

```tsx
import { useWorkerClient } from "@hexed/editor"

const MyPlugin: HexedPluginComponent = ({ file }) => {
  const workerClient = useWorkerClient()

  const handleProcess = async () => {
    const fileHandle = file.getHandle()
    if (!workerClient || !fileHandle) return

    const fileObj = await fileHandle.getFile()
    // Use workerClient methods for heavy operations
  }

  return <button onClick={handleProcess}>Process File</button>
}
```

## Best Practices

1. **Keep plugins focused** - Each plugin should have a single, clear purpose
2. **Handle null states** - Always check if `file` exists and `selectedOffset` is not null
3. **Use memoization** - Use `useMemo` for expensive computations based on file data
4. **Follow UI patterns** - Use components from `@hexed/ui` for consistency
5. **Provide feedback** - Show loading states and error messages when appropriate
6. **Respect user settings** - Use `settings` to adapt to user preferences

## TypeScript Types

All types are exported from `@hexed/plugins/types`:

```tsx
import type {
  HexedPlugin,
  HexedPluginComponent,
  HexedPluginOptions
} from "@hexed/plugins/types"
```

## API Reference

### `createHexedEditorPlugin(options: HexedPluginOptions): HexedPlugin`

Creates a plugin definition from the provided options.

### `pluginsWithHotkeys(plugins: HexedPlugin[]): HexedPlugin[]`

Automatically assigns hotkeys to sidebar plugins that don't have them.

### `HexedPluginComponent`

The type for plugin components. Receives `file`, `state`, and `settings` as props.

## Examples

See the existing plugins for reference:

- **Interpreter** (`src/core/interpreter.tsx`) - Displays interpreted values at the selected offset
- **Strings** (`src/core/strings.tsx`) - Extracts and displays strings from the file
- **Templates** (`src/core/templates/index.tsx`) - Parses binary files using Kaitai Struct templates
