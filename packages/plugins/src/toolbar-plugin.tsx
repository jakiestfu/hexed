
import { HexedPluginOptions } from "./types";
import { FunctionComponent } from "react";
import { useHexedSettingsContext, useHexedStateContext, useHexedFileContext } from "@hexed/editor";

export const ToolbarPlugin: FunctionComponent<HexedPluginOptions> = ({ title, icon: Icon, component: Component }) => {
  const settings = useHexedSettingsContext()
  const state = useHexedStateContext()
  const { input: { hexedFile } } = useHexedFileContext()
  if (!hexedFile) return null
  return (
    <div className="border-b" title={title}>
      <div className="p-4">
        <Component file={hexedFile} state={state} settings={settings} />
      </div>
    </div>
  )
}
