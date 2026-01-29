import * as monaco from "monaco-editor"
// import "monaco-editor/esm/vs/language/typescript/monaco.contribution"
// @ts-ignore - constrained-editor-plugin doesn't have type definitions
import constrainedEditor from "constrained-editor-plugin"
// @ts-ignore
import distTypes from "../../file/dist/file.d.ts?raw"
import { EditorProps } from "@monaco-editor/react"

// import chartTypes from "../../worker/node_modules/chart.js/dist/types.d.ts?raw"

type Monaco = typeof monaco

const chartTypes = import.meta.glob<string>(
  // Vite can read deps from node_modules like this
  "../../worker/node_modules/chart.js/dist/types/**/*.d.ts",
  { query: "?raw", eager: true, import: "default" }
)

export const template = `import { HexedFile } from "@hexed/file"
import { ChartConfiguration } from "chart.js"

export default async (file: HexedFile): Promise<ChartConfiguration> => {
  // Read the file and construct your data here
  const data = file.readBytes(0, Math.min(1024, file.size))

  // Return a Chart.js configuration object
  return {
    type: "bar",
    data: {
      labels: [],
      datasets: []
    }
  }
}`

export const addChartJsTypesToMonaco = (instance: Monaco) => {
  for (const [fsPath, dtsText] of Object.entries(chartTypes)) {
    const rel = fsPath.replace(/^.*\/node_modules\//, "")
    instance.typescript.typescriptDefaults.addExtraLib(
      String(dtsText),
      `file:///node_modules/${rel}`
    )
  }
  instance.typescript.typescriptDefaults.addExtraLib(
    `export * from "./dist/types/index.d.ts";`,
    "file:///node_modules/chart.js/index.d.ts"
  )
}


export const setupConstrainedEditor = (
  editor: monaco.editor.IStandaloneCodeEditor,
  instance: typeof monaco
): void => {
  const model = editor.getModel()
  if (!model) return

  const constrainedInstance = constrainedEditor(instance)
  constrainedInstance.initializeIn(editor)

  const editableLine = 5;

  const getRange = () => {
    const text = model.getValue()
    const lines = text.split("\n")
    const lineCount = model.getLineCount()

    const lastLineIndex = lineCount - 1

    const range = [editableLine, 1, lastLineIndex, lines[lastLineIndex - 1].length + 1]
    console.log(lines, range)
    return range
  }

  constrainedInstance.addRestrictionsTo(model, [
    {
      range: getRange(),
      label: "functionBody",
      allowMultiline: true
    }
  ])

  editor.addCommand(instance.KeyMod.CtrlCmd | instance.KeyCode.KeyA, () => {
    const model = editor.getModel()
    if (!model) return

    const range = getRange()
    const safe: monaco.IRange = {
      startLineNumber: range[0],
      startColumn: range[1],
      endLineNumber: range[2],
      endColumn: range[3],
    }

    editor.setSelection(safe)
    editor.revealRangeInCenterIfOutsideViewport(safe)
  })
}


export const onMount = (editor: monaco.editor.IStandaloneCodeEditor, instance: typeof monaco): void => {
  instance.typescript.typescriptDefaults.setCompilerOptions({
    target: instance.typescript.ScriptTarget.ES2020,
    module: instance.typescript.ModuleKind.ESNext,
    moduleResolution: instance.typescript.ModuleResolutionKind.NodeJs,
    lib: ["es2022", "dom", "dom.iterable"],
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    allowSyntheticDefaultImports: true,
    allowNonTsExtensions: true,
    noEmit: true,
  })

  addChartJsTypesToMonaco(instance)

  const types = `declare module "@hexed/file" { ${distTypes} } `
  instance.typescript.typescriptDefaults.addExtraLib(types, "file:///node_modules/@hexed/file/index.d.ts")

  setupConstrainedEditor(editor, instance)

  console.log(instance.typescript.typescriptDefaults.getExtraLibs())
}