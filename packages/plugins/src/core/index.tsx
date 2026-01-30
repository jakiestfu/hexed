import ts from "typescript"

import { pluginsWithHotkeys } from ".."
import { HexedPlugin, VisualizationPreset } from "../types"
import { fileSizePlugin } from "./labels/file-size"
import { memoryProfilerPlugin } from "./labels/memory-profiler"
import { interpreterPlugin } from "./sidebars/interpreter"
import { stringsPlugin } from "./sidebars/strings"
import { templatesPlugin } from "./sidebars/templates"
import { searchPlugin } from "./toolbars/search"

const defaultExports = extractDefaultVisualizationExports(
  import.meta.glob<string>("./visualizations/**/*.(ts|tsx)", {
    query: "?raw",
    eager: true,
    import: "default"
  })
)

export const visualizations: VisualizationPreset[] = Object.entries(
  import.meta.glob<VisualizationPreset>("./visualizations/**/*.(ts|tsx)", {
    eager: true,
    import: "visualization"
  })
).map(([path, module]) => {
  const source = defaultExports[path]
  return {
    ...module,
    source
  }
})

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  searchPlugin,
  fileSizePlugin,
  memoryProfilerPlugin
])

function extractDefaultVisualizationExports(
  modules: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {}

  for (const [filePath, sourceCode] of Object.entries(modules)) {
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS

    const sf = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ true,
      scriptKind
    )

    let extracted: string | null = null

    const visit = (node: ts.Node): void => {
      if (extracted) return

      // Case 1: `export default <expr>;`
      if (ts.isExportAssignment(node) && !node.isExportEquals) {
        // This slice will include `export default ...;`
        extracted = sourceCode.slice(node.getStart(sf), node.getEnd())
        return
      }

      // Case 2: `export default function ... {}` / `export default async function ... {}`
      if (ts.isFunctionDeclaration(node)) {
        const mods = ts.getModifiers(node)
        const hasExport = mods?.some(
          (m) => m.kind === ts.SyntaxKind.ExportKeyword
        )
        const hasDefault = mods?.some(
          (m) => m.kind === ts.SyntaxKind.DefaultKeyword
        )

        if (hasExport && hasDefault) {
          extracted = sourceCode.slice(node.getStart(sf), node.getEnd())
          return
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sf)

    if (extracted) {
      // Key however you want. Keeping filePath is simplest + stable.
      out[filePath] = extracted?.trim() ?? ""
    }
  }

  return out
}
