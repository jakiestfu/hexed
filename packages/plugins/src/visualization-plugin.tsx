import { FunctionComponent } from "react"
import { X } from "lucide-react"

import {
  useHexedFileContext,
  useHexedSettingsContext,
  useHexedStateContext
} from "@hexed/editor"
import { Button } from "@hexed/ui"

import { HexedPluginOptions } from "./types"

export const VisualizationPlugin: FunctionComponent<HexedPluginOptions> = ({
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
  if (!hexedFile || type !== "visualization") return null

  return (
    <div className="h-full w-full relative">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Button
          onClick={() => settings.setVisualization(null)}
          variant="ghost"
          size="icon-lg"
        >
          <X className="size-4" />
        </Button>
      </div>
      <Component
        foo="bar"
        file={hexedFile}
        state={state}
        settings={settings}
      />
    </div>
  )
}
