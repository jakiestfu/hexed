"use client"
import * as monaco from "monaco-editor"
import { useEffect, useRef, useState } from "react"
import type { FunctionComponent } from "react"
import { Editor as MonacoEditor } from "@monaco-editor/react"
import type { EditorProps, OnValidate } from "@monaco-editor/react"
import {
  AlertCircle,
  BarChart,
  Info,
  SplitSquareHorizontal,
  SplitSquareVertical
} from "lucide-react"
import ts from "typescript"

import { HexedFile } from "@hexed/file"
import { Visualization } from "@hexed/plugins"
// import { useHexedFileContext } from "@hexed/editor"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger
} from "@hexed/ui"

import { onMount, template } from "./monaco-setup"
import type { WorkbenchProps } from "./types"
import { useIsValidTypeScript } from "./hooks/use-is-valid-typescript"
import { ErrorsPopover } from "./components/errors-popover"

type WorkbenchView = "code" | "split" | "preview"
type SplitDirection = "horizontal" | "vertical"

const stripTypeScript = (tsCode: string) => {
  const res = ts.transpileModule(tsCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      isolatedModules: true
    },
    fileName: "user.ts"
  })
  return res.outputText
}

const PreviewPanel: FunctionComponent<{
  evaluateFunction?: string
  hexedFile: HexedFile | null
}> = ({ evaluateFunction, hexedFile }) => {
  if (!evaluateFunction || !hexedFile) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Preview</p>
          <p className="text-sm">Execution results will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <Visualization
      id={evaluateFunction}
      title="Preview"
      icon={BarChart}
      visualization={evaluateFunction}
    />
  )
}

export const Workbench: FunctionComponent<WorkbenchProps> = ({
  value,
  onChange,
  // onMount,
  className,
  height = "600px",
  width = "100%",
  theme = "vs-dark",
  options,
  hexedFile,
  visualizations
}) => {

  const isValidTs = useIsValidTypeScript(value)

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const [view, setView] = useState<WorkbenchView>("preview")
  const [splitDirection, setSplitDirection] =
    useState<SplitDirection>("horizontal")
  const [evaluateFunction, setEvaluateFunction] = useState<string | undefined>(
    undefined
  )
  const [editMode, setEditMode] = useState<boolean>(false)
  const [presetId, setSelectedPresetId] = useState("")

  const selectedPreset = visualizations?.find((p) => p.id === presetId)

  const handleBuild = () => {
    setEvaluateFunction(stripTypeScript(value))
  }

  const onChangePreset = (id: string) => {
    const preset = visualizations?.find((p) => p.id === id)
    if (preset?.source) {
      onChange(preset.source)
      setSelectedPresetId(id)
      setEvaluateFunction(stripTypeScript(preset.source))
    }
  }

  useEffect(() => {
    if (presetId === "") {
      onChangePreset(visualizations?.[0]?.id || "")
    }
  }, [visualizations])

  const handleSelectError = (err: monaco.editor.IMarkerData) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    editor.focus()
    editor.revealPositionInCenter({
      lineNumber: err.startLineNumber,
      column: err.startColumn
    })
    editor.setPosition({
      lineNumber: err.startLineNumber,
      column: err.startColumn
    })
  }

  const [errors, setErrors] = useState<monaco.editor.IMarker[]>([])
  const editor = (
    <MonacoEditor
      path="file:///hexed.visualization.ts"
      height={height}
      width={width}
      language="typescript"
      theme={theme}
      defaultValue={value}
      value={value}
      onChange={onChange}
      onMount={(editor, monacoInstance) => {
        editorRef.current = editor
        onMount(editor, monacoInstance)
      }}
      onValidate={(markers) => {
        setErrors(markers.filter((mk) => mk.severity === monaco.MarkerSeverity.Error))
      }}
      className="relative overflow-visible z-10 grow"
      loading={
        <div className="h-full w-full flex items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: "on",
        roundedSelection: false,
        readOnly: false,
        cursorStyle: "line",
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        fixedOverflowWidgets: true,
        ...options
      }}
    />
  )

  return (
    <div className={className}>
      <Card
        className={`p-0 m-0 w-full h-full rounded-none border-none shadow-none overflow-hidden ${className}`}
      >
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "code" | "split" | "preview")}
          className="gap-0 h-full"
        >
          <CardHeader className="p-0! gap-0 m-0 bg-muted/30 relative">
            <div className="flex items-center justify-between p-4 border-b overflow-hidden">
              <div className="flex flex-1 gap-2 ">
                <Select
                  onValueChange={onChangePreset}
                  value={presetId}
                >
                  <SelectTrigger className="w-full max-w-48">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Presets</SelectLabel>
                      {visualizations?.map((preset) => (
                        <SelectItem
                          key={preset.id}
                          value={preset.id}
                        >
                          {preset.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* Shows a popover */}
                {selectedPreset?.info ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setView("preview")
                        }}
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="text-sm text-muted-foreground"
                    >
                      {selectedPreset.info}
                    </PopoverContent>
                  </Popover>
                ) : null}

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "transition-opacity",
                    view === "split"
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  )}
                  onClick={() =>
                    setSplitDirection((prev) =>
                      prev === "horizontal" ? "vertical" : "horizontal"
                    )
                  }
                  title={
                    splitDirection === "horizontal"
                      ? "Switch to vertical split"
                      : "Switch to horizontal split"
                  }
                >
                  {splitDirection === "horizontal" ? (
                    <SplitSquareVertical className="h-4 w-4" />
                  ) : (
                    <SplitSquareHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center grow justify-center max-w-lg">
                {editMode ? (
                  <TabsList className="w-full">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="split">Split</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                ) : null}
              </div>
              <div className="flex flex-1 justify-end gap-2">
                {editMode ? (
                  <>
                    {errors.length ? (
                      <ErrorsPopover
                        errors={errors}
                        onSelectError={handleSelectError}
                      />
                    ) : null}
                    <Button onClick={handleBuild} disabled={!!errors.length}>Run</Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setView("split")
                      setEditMode(true)
                    }}
                    variant="outline"
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="grow min-h-0 overflow-hidden p-0">
            {view === "code" && <div className="h-full w-full flex flex-col">{editor}</div>}
            {view === "split" && (
              <ResizablePanelGroup
                direction={splitDirection}
                className="h-full w-full"
              >
                <ResizablePanel
                  defaultSize={50}
                  minSize={20}
                >
                  <div className="h-full w-full flex flex-col">{editor}</div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={50}
                  minSize={20}
                >
                  <PreviewPanel
                    hexedFile={hexedFile}
                    evaluateFunction={evaluateFunction}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
            {view === "preview" && (
              <PreviewPanel
                hexedFile={hexedFile}
                evaluateFunction={evaluateFunction}
              />
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
