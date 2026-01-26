
import { HexedPluginOptions } from "./types";
import { FunctionComponent } from "react";
import { useHexedSettingsContext, useHexedStateContext, useHexedFileContext } from "@hexed/editor";

export const LabelPlugin: FunctionComponent<HexedPluginOptions> = ({ title, icon: Icon, component: Component }) => {
  const settings = useHexedSettingsContext()
  const state = useHexedStateContext()
  const { input: { hexedFile } } = useHexedFileContext()
  if (!hexedFile) return null
  return (
    <Component file={hexedFile} state={state} settings={settings} />
  )
}
