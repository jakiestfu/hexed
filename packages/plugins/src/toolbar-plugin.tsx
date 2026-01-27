import { FunctionComponent } from "react"

import {
  useHexedFileContext,
  useHexedSettingsContext,
  useHexedStateContext
} from "@hexed/editor"

import { HexedPluginOptions } from "./types"

export const ToolbarPlugin: FunctionComponent<HexedPluginOptions> = ({
  type,
  title,
  icon: Icon,
  component: Component,
}) => {
  const settings = useHexedSettingsContext()
  const state = useHexedStateContext()
  const {
    input: { hexedFile }
  } = useHexedFileContext()
  if (!hexedFile || type !== "toolbar") return null
  return (
    <div
      className="border-b"
      title={title}
    >
      <div className="p-4">
        <Component
          // foo="bar"
          file={hexedFile}
          state={state}
          settings={settings}
        />
      </div>
    </div>
  )
}
