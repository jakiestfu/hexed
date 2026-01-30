import { Fragment, type FunctionComponent } from "react"
import { CaseSensitive } from "lucide-react"

// import { MemoryProfiler } from "../common/memory-profiler"
import { HexedPlugin } from "@hexed/plugins/types"
import {
  cn,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
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
    view,
    setView
  } = useHexedSettingsContext()

  const visibleLabelPlugins = plugins.filter((plugin) =>
    visibleLabels.includes(plugin.id)
  )

  return (
    <div className="flex w-full flex-col gap-3 border-t bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:gap-4 h-auto md:h-[66px]">
      {/* left */}
      <div className="flex w-full min-w-0 md:w-auto md:flex-1">
        <div className="flex w-full grow items-center gap-2">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "edit" | "visualize")}
            className="w-full"
          >
            <TabsList className="w-full md:max-w-3xs border">
              <TabsTrigger
                value="edit"
                className={cn(
                  "font-mono text-xs",
                  view === "edit" || view === null ? "bg-accent" : ""
                )}
              >
                Edit
              </TabsTrigger>
              <TabsTrigger
                value="visualize"
                // onClick={() => setView("visualize")}
                className={cn(
                  "font-mono text-xs",
                  view === "visualize" ? "bg-accent" : ""
                )}
              >
                Visualize
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* center */}
      <div className="order-last w-full items-center justify-start md:order-0 md:w-auto md:flex md:justify-center h-full">
        <div className="items-center gap-2 md:gap-4 font-mono flex items-center justify-center h-full mt-2 md:mt-0 whitespace-nowrap">
          {visibleLabelPlugins.map((plugin, index) => (
            <Fragment key={plugin.id}>
              <span className="flex items-center">{plugin.component}</span>
              {index < visibleLabelPlugins.length - 1 && (
                <>
                  <Separator orientation="vertical" className="hidden md:flex" />
                  <span className="flex md:hidden text-muted-foreground">&middot;</span>
                </>
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
                disabled={view !== "edit"}
                className={cn(
                  "grow md:grow-0 transition-opacity",
                  showAscii ? "bg-accent" : ""
                )}
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
            disabled={view !== "edit"}
            className="grow md:grow-0 transition-opacity"
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
