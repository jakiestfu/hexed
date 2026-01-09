# @hexed/binary-templates

A package for parsing binary formats using Kaitai Struct definitions.

## Overview

This package provides:

- Individual exports for each template parser (e.g., `parseId3`)
- A lazy-loading function that loads parsers dynamically by template name

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the Kaitai Struct parsers:

   ```bash
   pnpm build:ksy
   ```

   This compiles all `.ksy` files in `src/ksy/` to TypeScript parsers in `src/generated/`.

## Usage

### Direct Import

```typescript
import { parseId3 } from "@hexed/binary-templates";

const buffer = // ... your ArrayBuffer
const result = parseId3(buffer);
```

### Lazy Loading

```typescript
import { parseTemplate } from "@hexed/binary-templates";

const buffer = // ... your ArrayBuffer
const result = await parseTemplate("id3v2", buffer);
```

## Adding New Templates

1. Add your `.ksy` file to `src/ksy/` (e.g., `src/ksy/myformat.ksy`)
2. Run `pnpm build:ksy` to generate the TypeScript parser
3. Create a parser wrapper in `src/parsers/myformat.ts`:

   ```typescript
   import { KaitaiStream } from "kaitai-struct";
   import MyFormat from "../generated/myformat";

   export function parseMyFormat(buffer: ArrayBuffer) {
     const stream = new KaitaiStream(buffer);
     return new MyFormat(stream);
   }
   ```

4. Export it in `src/index.ts`:
   ```typescript
   export { parseMyFormat } from "./parsers/myformat";
   ```
5. Add it to the `TEMPLATE_MAP` in `src/lazy-loader.ts`:
   ```typescript
   const TEMPLATE_MAP = {
     id3v2: () => import("./parsers/id3v2"),
     myformat: () => import("./parsers/myformat"),
   };
   ```

## Scripts

- `pnpm build:ksy` - Compile all `.ksy` files to TypeScript
- `pnpm typecheck` - Type check the package
- `pnpm clean` - Remove generated files and node_modules
