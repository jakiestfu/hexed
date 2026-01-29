import { Fragment, type FunctionComponent } from "react"
import { CaseSensitive, Plus } from "lucide-react"

// import { MemoryProfiler } from "../common/memory-profiler"
import { HexedPlugin } from "@hexed/plugins/types"
import {
  Button,
  cn,
  Separator,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@hexed/ui"

import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"

export type HexFooterProps = {
  plugins: HexedPlugin[]
}

export const HexFooter: FunctionComponent<HexFooterProps> = ({ plugins }) => {
  const {
    showAscii,
    setShowAscii,
    visibleLabels,
    sidebar,
    setSidebar,
    visualization,
    setVisualization
  } = useHexedSettingsContext()

  const visibleLabelPlugins = plugins.filter((plugin) =>
    visibleLabels.includes(plugin.id)
  )

  return (
    <div className="flex w-full flex-col gap-3 border-t bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:gap-4 h-auto md:h-[66px]">
      {/* left */}
      <div className="flex w-full min-w-0 md:w-auto md:flex-1">
        <div className="flex w-full grow items-center gap-2">
          <ToggleGroup
            type="single"
            value={visualization ?? ""}
            onValueChange={(value) => setVisualization(value)}
            variant="outline"
            size="sm"
            className="grow md:grow-0"
          >
            {plugins
              .filter((plugin) => plugin.type === "visualization")
              .map((plugin) => (
                <Tooltip key={plugin.id}>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value={plugin.id}
                      aria-label={`Toggle ${plugin.title} visualization`}
                      className={cn(
                        "grow md:grow-0",
                        visualization === plugin.id ? "bg-accent" : ""
                      )}
                    >
                      <plugin.icon />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>{plugin.title}</TooltipContent>
                </Tooltip>
              ))}
          </ToggleGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisualization("workbench")}
                aria-label="Open Workbench"
                className={cn(
                  "grow md:grow-0",
                  visualization === "workbench" ? "bg-accent" : ""
                )}
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open Workbench</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* center */}
      <div className="order-last hidden w-full items-center justify-start md:order-none md:w-auto md:flex md:justify-center h-full">
        <div className="items-center gap-4 font-mono hidden md:flex h-full">
          {visibleLabelPlugins.map((plugin, index) => (
            <Fragment key={plugin.id}>
              <span className="flex items-center">{plugin.component}</span>
              {index < visibleLabelPlugins.length - 1 && (
                <Separator orientation="vertical" />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* right */}
      <div className="flex w-full min-w-0 items-center justify-start md:w-auto md:flex-1 md:justify-end">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                variant="outline"
                pressed={showAscii}
                onPressedChange={setShowAscii}
                aria-label="Toggle ASCII view"
                size="sm"
                className={cn("grow md:grow-0", showAscii ? "bg-accent" : "")}
              >
                <CaseSensitive />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Toggle ASCII view</TooltipContent>
          </Tooltip>

          <ToggleGroup
            type="single"
            value={sidebar ?? ""}
            onValueChange={setSidebar}
            variant="outline"
            size="sm"
            className="grow md:grow-0"
          >
            {plugins
              .filter((plugin) => plugin.type === "sidebar")
              .map((plugin) => (
                <Tooltip key={plugin.id}>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value={plugin.id}
                      aria-label={`Toggle ${plugin.title}`}
                      className={cn(
                        "grow md:grow-0",
                        sidebar === plugin.id ? "bg-accent" : ""
                      )}
                    >
                      <plugin.icon />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>{plugin.title}</TooltipContent>
                </Tooltip>
              ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}
