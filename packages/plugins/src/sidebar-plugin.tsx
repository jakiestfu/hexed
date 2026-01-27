import { FunctionComponent } from "react"
import { ArrowLeftRight, X } from "lucide-react"

import {
  useHexedFileContext,
  useHexedSettingsContext,
  useHexedStateContext
} from "@hexed/editor"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@hexed/ui"

import { HexedPluginOptions } from "./types"

export const SidebarPlugin: FunctionComponent<HexedPluginOptions> = ({
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
  if (!hexedFile || type !== "sidebar") return null
  return (
    <div className="h-full">
      <Card className="h-full flex flex-col p-0 rounded-none border-none bg-sidebar overflow-hidden gap-0">
        <CardHeader className="py-3! px-4 border-b shrink-0 gap-0 bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-sm font-medium shrink-0 flex-1 flex items-center gap-2">
                <Icon className="size-4" />
                {title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={settings.toggleSidebarPosition}
                    className="h-7 w-7 p-0"
                    aria-label="Toggle sidebar position"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle sidebar position</TooltipContent>
              </Tooltip>
              {settings.setSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => settings.setSidebar(null)}
                  className="h-7 w-7 p-0"
                  aria-label="Close interpreter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          <Component
            file={hexedFile}
            state={state}
            settings={settings}
          />
        </CardContent>
      </Card>
    </div>
  )
}
