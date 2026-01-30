import type { EditorProps } from "@monaco-editor/react"

import type { HexedFile } from "@hexed/file"
import type { VisualizationPreset } from "@hexed/plugins/types"

export type WorkbenchProps = {
  /**
   * The current value of the editor
   */
  value: string
  /**
   * Callback fired when the editor value changes
   */
  onChange: (value: string | undefined) => void
  /**
   * Optional callback fired when the editor is mounted
   */
  onMount?: EditorProps["onMount"]
  /**
   * Optional className for the container
   */
  className?: string
  /**
   * Optional height of the editor (default: "600px")
   */
  height?: string | number
  /**
   * Optional width of the editor (default: "100%")
   */
  width?: string | number
  /**
   * Optional theme (default: "vs-dark")
   */
  theme?: "vs" | "vs-dark" | "hc-black"
  /**
   * Optional editor options
   */
  options?: EditorProps["options"]
  /**
   * Optional hexed file instance for visualization
   */
  hexedFile: HexedFile

  /**
   * Visualization presets for the workbench
   */
  visualizations?: VisualizationPreset[]
}
