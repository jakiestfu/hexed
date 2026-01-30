// @ts-ignore - constrained-editor-plugin doesn't have type definitions
import constrainedEditor from "constrained-editor-plugin"
import * as monaco from "monaco-editor"

// @ts-ignore
import distTypes from "../../file/dist/file.d.ts?raw"

type Monaco = typeof monaco

const chartTypes = import.meta.glob<string>(
  "../../worker/node_modules/chart.js/dist/types/**/*.d.ts",
  { query: "?raw", eager: true, import: "default" }
)

const defaultBody = `// Read the file and construct your data here
  const data = file.readBytes(0, Math.min(1024, file.size))

  // Return a Chart.js configuration object
  return {
    type: "bar",
    data: {
      labels: [],
      datasets: []
    }
  }`

// IMPORTANT: make sure the Monaco model URI ends with `.hexed.ts`
// so the ambient module "*.hexed.ts" applies.
export const template = (
  body?: string
) => `export default (async (file, api) => {
  ${body ?? defaultBody}
}) satisfies HexedVisualization`

export const addChartJsTypesToMonaco = (instance: Monaco): void => {
  for (const [fsPath, dtsText] of Object.entries(chartTypes)) {
    const rel = fsPath.replace(/^.*\/node_modules\//, "")
    instance.typescript.typescriptDefaults.addExtraLib(
      String(dtsText),
      `file:///node_modules/${rel}`
    )
  }

  // chart.js package entry typing
  instance.typescript.typescriptDefaults.addExtraLib(
    `export * from "./dist/types/index.d.ts";`,
    "file:///node_modules/chart.js/index.d.ts"
  )
}

export const addHexedScriptTypesToMonaco = (instance: Monaco): void => {
  // 1) Provide @hexed/file typings (as you already do)
  const hexedFileTypes = `declare module "@hexed/file" { ${distTypes} }`
  instance.typescript.typescriptDefaults.addExtraLib(
    hexedFileTypes,
    "file:///node_modules/@hexed/file/index.d.ts"
  )

  const scriptTypes = `
  declare global {
    type HexedVisualization = import("@hexed/file").HexedVisualization
    type HexedFile = import("@hexed/file").HexedFile
    type ChartConfiguration = import("chart.js").ChartConfiguration
  }
  export {}
`
  instance.typescript.typescriptDefaults.addExtraLib(
    scriptTypes,
    "file:///node_modules/@hexed/file/ambient.d.ts"
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

  // With the new template, editable content starts immediately.
  // If you still want to lock the first N lines, adjust this.
  const editableLine = 2

  const getRange = (): [number, number, number, number] => {
    const lines = model.getValue().split("\n")
    const lineCount = model.getLineCount()

    const lastLine = lines[lineCount] ?? ""
    return [editableLine, 1, lineCount, lastLine.length + 1]
  }
  console.log(getRange())
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

    const [startLineNumber, startColumn, endLineNumber, endColumn] = getRange()
    const safe: monaco.IRange = {
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn
    }

    editor.setSelection(safe)
    editor.revealRangeInCenterIfOutsideViewport(safe)
  })
}

export const onMount = (
  editor: monaco.editor.IStandaloneCodeEditor,
  instance: typeof monaco
): void => {
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
    noEmit: true
  })

  addChartJsTypesToMonaco(instance)
  addHexedScriptTypesToMonaco(instance)
  // console.log(instance.typescript.typescriptDefaults.getExtraLibs())
  // setupConstrainedEditor(editor, instance)
}
