# @hexed/binary-templates

A package for parsing binary file formats using [Kaitai Struct](https://kaitai.io/) definitions. This package automatically syncs format definitions from the [Kaitai Struct Format Gallery](https://formats.kaitai.io/) and compiles them into JavaScript parsers.

## Overview

This package provides:

- **100+ binary format parsers** from the Kaitai Struct format gallery
- **Automatic format synchronization** from the official format repository
- **Lazy-loading parser** that dynamically loads parsers by format name
- **Organized by category** (3D models, archives, executables, images, multimedia, etc.)

## Features

- 🚀 **Automatic sync** - Pull the latest format definitions from the Kaitai format gallery
- 📦 **100+ formats** - Support for archives, executables, images, multimedia, network protocols, and more
- 🗂️ **Organized structure** - Formats are organized by category (3d, archive, executable, image, media, etc.)
- ⚡ **Lazy loading** - Parsers are loaded on-demand for optimal performance
- 🔧 **Type-safe** - Built with TypeScript for better developer experience

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Git (for cloning format repository)

### Installation

1. Install dependencies:

```bash
pnpm install
```

The `postinstall` script will automatically install the Kaitai Struct compiler if it's not already available.

2. Sync format definitions from the Kaitai format gallery:

```bash
pnpm sync:ksy
```

This command:

- Clones the [kaitai_struct_formats](https://github.com/kaitai-io/kaitai_struct_formats) repository
- Copies all `.ksy` format definition files to `src/ksy/`
- Maintains the original folder structure
- Generates a `manifest.json` file with format metadata

3. Build the parsers:

```bash
pnpm build:ksy
```

This compiles all `.ksy` files from the manifest into JavaScript parsers in the `dist/` directory, maintaining the same folder structure.

## Usage

### Lazy Loading (Recommended)

Use the `parseTemplate` function to dynamically load and parse formats:

```typescript
import { parseTemplate } from "@hexed/binary-templates";

// Parse a file buffer
const buffer = await file.arrayBuffer();
const result = await parseTemplate("id3v2_3", buffer);

console.log(result);
```

### Accessing the Manifest

You can import the manifest to see all available formats:

```typescript
import manifest from "@hexed/binary-templates/manifest.json";

// List all formats
manifest.forEach((format) => {
  console.log(`${format.format}: ${format.title}`);
  console.log(`  Category: ${format.category}`);
  console.log(`  Path: ${format.path}`);
});
```

### Format Categories

Formats are organized into the following categories:

- **3d** - 3D model formats (GLTF, Quake models, etc.)
- **archive** - Archive formats (ZIP, RAR, GZIP, etc.)
- **executable** - Executable and bytecode formats (ELF, PE, Mach-O, etc.)
- **image** - Image formats (PNG, JPEG, BMP, GIF, etc.)
- **media** - Multimedia formats (MP3/ID3, WAV, AVI, etc.)
- **network** - Network protocol formats (DNS, TCP, UDP, etc.)
- **filesystem** - Filesystem formats (ext2, FAT, ISO9660, etc.)
- **database** - Database formats (SQLite, DBF, etc.)
- **serialization** - Serialization formats (BSON, MessagePack, etc.)
- And many more...

See `src/ksy/manifest.json` for the complete list of available formats.

## Scripts

- `pnpm sync:ksy` - Sync format definitions from the Kaitai format gallery
- `pnpm build:ksy` - Compile all `.ksy` files to JavaScript parsers
- `pnpm typecheck` - Type check the package
- `pnpm clean` - Remove generated files and node_modules

## Project Structure

```
packages/binary-templates/
├── src/
│   ├── ksy/              # Kaitai Struct format definitions (.ksy files)
│   │   ├── 3d/
│   │   ├── archive/
│   │   ├── executable/
│   │   ├── image/
│   │   ├── media/
│   │   ├── network/
│   │   └── manifest.json  # Format metadata manifest
│   ├── lazy-loader.ts    # Dynamic parser loader
│   └── index.ts          # Package exports
├── dist/                 # Compiled JavaScript parsers (generated)
├── scripts/
│   ├── sync-ksy.js       # Sync formats from gallery
│   ├── build-ksy.js      # Build parsers from .ksy files
│   └── install-kaitai.sh # Install Kaitai Struct compiler
└── package.json
```

## How It Works

1. **Sync** (`sync:ksy`): Clones the Kaitai format gallery repository and extracts all `.ksy` format definition files, maintaining folder structure and generating a manifest.

2. **Build** (`build:ksy`): Reads the manifest and compiles each `.ksy` file using the Kaitai Struct compiler, generating JavaScript parsers in the `dist/` directory.

3. **Parse**: The lazy loader dynamically imports and executes parsers based on format names.

## Adding Custom Formats

If you need to add a custom format that's not in the gallery:

1. Add your `.ksy` file to `src/ksy/` (e.g., `src/ksy/custom/myformat.ksy`)
2. Update `src/ksy/manifest.json` to include your format:
   ```json
   {
     "category": "custom",
     "format": "myformat",
     "title": "My Custom Format",
     "path": "custom/myformat.ksy"
   }
   ```
3. Run `pnpm build:ksy` to compile it
4. The format will be available via `parseTemplate("myformat", buffer)`

## Resources

- [Kaitai Struct Documentation](https://doc.kaitai.io/)
- [Kaitai Struct Format Gallery](https://formats.kaitai.io/)
- [Kaitai Struct Format Repository](https://github.com/kaitai-io/kaitai_struct_formats)
- [Kaitai Struct Web IDE](https://ide.kaitai.io/)

## License

This package is private and part of the Hexed monorepo. Individual format definitions are licensed according to their respective licenses (see `meta/license` tags in each `.ksy` file).
