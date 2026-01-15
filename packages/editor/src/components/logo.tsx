import { FunctionComponent, useState } from "react"
import { ChevronDown, Ghost } from "lucide-react"

import type { BinarySnapshot } from "@hexed/types"
import { Button, cn, DropdownMenu, DropdownMenuTrigger } from "@hexed/ui"

import { Menu, type MenuItem, type PackageInfo } from "./menu"

export type { MenuItem } from "./menu"

export type LogoProps = {
  inline?: boolean
  currentSnapshot?: BinarySnapshot | null
  showHistogram?: boolean
  onShowHistogramChange?: (show: boolean) => void
  // Theme
  theme?: string
  setTheme?: (theme: string) => void
  // Package info
  packageInfo?: PackageInfo
  onHandleIdChange?: (handleId: string | null) => void
}

export const Brand: FunctionComponent<{
  className?: string
  glitch?: boolean
}> = ({ className, glitch }) => (
  <div
    className={cn(
      "flex justify-center items-center gap-2 logo-container-inline",
      className
    )}
  >
    <Ghost />

    <div
      className={cn("font-mono font-bold", glitch && "glitch layers")}
      data-text="hexed"
    >
      <span>hexed</span>
    </div>
  </div>
)

export const Logo: FunctionComponent<LogoProps> = ({
  inline = false,
  currentSnapshot,
  showHistogram: controlledShowHistogram,
  onShowHistogramChange: controlledOnShowHistogramChange,
  theme,
  setTheme,
  packageInfo,
  onHandleIdChange
}) => {
  const [internalShowHistogram, setInternalShowHistogram] = useState(false)

  // Use controlled state if provided, otherwise use internal state
  const showHistogram = controlledShowHistogram ?? internalShowHistogram
  const onShowHistogramChange =
    controlledOnShowHistogramChange ?? setInternalShowHistogram

  if (inline) return <Brand />

  return (
    <div className="flex justify-center gap-2 logo-container">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <Ghost />
            <span className="font-mono font-bold">hexed</span>
            <ChevronDown className="opacity-50 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <Menu
          currentSnapshot={currentSnapshot}
          showHistogram={showHistogram}
          onShowHistogramChange={onShowHistogramChange}
          onHandleIdChange={onHandleIdChange}
          theme={theme}
          setTheme={setTheme}
          packageInfo={packageInfo}
        />
      </DropdownMenu>
    </div>
  )
}
