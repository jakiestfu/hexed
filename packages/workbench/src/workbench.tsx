"use client"

import { Editor as MonacoEditor } from "@monaco-editor/react"
import type { EditorProps } from "@monaco-editor/react"
import { BarChart, SplitSquareHorizontal, SplitSquareVertical } from "lucide-react"
import { useState } from "react"
import type { FunctionComponent } from "react"

import { Visualization } from "@hexed/plugins"
// import { useHexedFileContext } from "@hexed/editor"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
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
import ts from "typescript"

import { onMount, template } from "./monaco-setup"
import type { WorkbenchProps } from "./types"
import { HexedFile } from "@hexed/file"

type WorkbenchView = "code" | "split" | "preview"
type SplitDirection = "horizontal" | "vertical"

const stripTypeScript = (tsCode: string) => {
  const res = ts.transpileModule(tsCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      isolatedModules: true,
    },
    fileName: "user.ts",
  })
  return res.outputText
}

const PreviewPanel: FunctionComponent<{ evaluateFunction?: string, hexedFile: HexedFile | null }> = ({ evaluateFunction, hexedFile }) => {
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
  const [view, setView] = useState<WorkbenchView>("split")
  const [splitDirection, setSplitDirection] = useState<SplitDirection>("horizontal")
  const [evaluateFunction, setEvaluateFunction] = useState<string | undefined>(undefined)
  const [selectedPreset, setSelectedPreset] = useState("")

  const handleBuild = () => {
    const javascriptCode = stripTypeScript(value)
    // Store the current editor value as the function string
    setEvaluateFunction(javascriptCode)
    // Switch to preview view if not already in split or preview
    // if (view === "code") {
    //   setView("preview")
    // }
  }

  const editor = (
    <MonacoEditor
      path="file:///hexed.visualization.ts"
      height={height}
      width={width}
      language="typescript"
      theme={theme}
      value={value}
      onChange={onChange}
      onMount={onMount}
      className="relative overflow-visible z-10"
      loading={(
        <div className="h-full w-full flex items-center justify-center">
          <Spinner className="size-8" />
        </div>
      )}
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
              <div className="flex flex-1">

                <Select onValueChange={(id) => {
                  const preset = visualizations?.find(p => p.id === id)
                  if (preset) {
                    const visualization = preset.visualization.toString()
                    const firstBrace = visualization.indexOf("{")
                    const lastBrace = visualization.lastIndexOf("}")
                    const body = visualization.slice(firstBrace + 1, lastBrace)
                    onChange(template(body))
                  }
                }}>
                  <SelectTrigger className="w-full max-w-48">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Presets</SelectLabel>
                      {visualizations?.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>{preset.title}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("transition-opacity", view === "split" ? "opacity-100" : "opacity-0 pointer-events-none")}
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
                <TabsList className="w-full">
                  <TabsTrigger value="code">Code</TabsTrigger>
                  <TabsTrigger value="split">Split</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex flex-1 justify-end">
                <Button onClick={handleBuild} className="cursor-pointer">Render</Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grow min-h-0 overflow-hidden p-0">
            {view === "code" && (
              <div className="h-full w-full">{editor}</div>
            )}
            {view === "split" && (
              <ResizablePanelGroup
                direction={splitDirection}
                className="h-full w-full"
              >
                <ResizablePanel defaultSize={50} minSize={20}>
                  <div className="h-full w-full">{editor}</div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={20}>
                  <PreviewPanel hexedFile={hexedFile} evaluateFunction={evaluateFunction} />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
            {view === "preview" && <PreviewPanel hexedFile={hexedFile} evaluateFunction={evaluateFunction} />}
          </CardContent>
        </Tabs></Card>
    </div>
  )
}
