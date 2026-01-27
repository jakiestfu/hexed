import { FunctionComponent } from "react"

import {
  useHexedFileContext,
  useHexedSettingsContext,
  useHexedStateContext
} from "@hexed/editor"

import { HexedPluginOptions, HexedPluginOptionsForType } from "./types"

export const LabelPlugin: FunctionComponent<HexedPluginOptions> = ({
  type,
  title,
  icon: Icon,
  component: Component
}) => {
  const settings = useHexedSettingsContext()
  const state = useHexedStateContext()
  const {
    input: { hexedFile }
  } = useHexedFileContext()
  if (!hexedFile || type !== "label") return null

  return (
    <Component
      // foo="bar"
      file={hexedFile}
      state={state}
      settings={settings}
    />
  )
}
