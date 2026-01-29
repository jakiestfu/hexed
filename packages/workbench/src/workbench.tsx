"use client"

import { Editor as MonacoEditor } from "@monaco-editor/react"
import type { EditorProps } from "@monaco-editor/react"
import { useRef } from "react"
import type { FunctionComponent } from "react"

import { onMount, setupConstrainedEditor, setupMonacoTypes } from "./monaco-setup"
import type { WorkbenchProps } from "./types"

export const Workbench: FunctionComponent<WorkbenchProps> = ({
  value,
  onChange,
  // onMount,
  className,
  height = "600px",
  width = "100%",
  theme = "vs-dark",
  options
}) => {
  const setupCompleteRef = useRef(false)


  return (
    <div className={className}>
      <MonacoEditor
        path="file:///src/main.ts"
        height={height}
        width={width}
        language="typescript"
        theme={theme}
        value={value}
        onChange={onChange}
        onMount={onMount}
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
          ...options
        }}
      />
    </div>
  )
}
