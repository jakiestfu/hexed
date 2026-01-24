import { FunctionComponent, useState } from "react"
import { MenuIcon } from "lucide-react"

import { Button, cn, DropdownMenu, DropdownMenuTrigger } from "@hexed/ui"

import { OnHexedInputChange } from "../../hooks/use-hexed-input"
import { Menu } from "./menu"

export type { MenuItem } from "./menu"

import packageJson from '../../../../../package.public.json'
import { useHexedInputContext } from "../../providers/hex-input-provider"


export const Brand: FunctionComponent<{
  className?: string
  animate?: boolean
}> = ({ className, animate = true }) => {
  const text = packageJson.name

  if (!animate) {
    return (
      <h1 className={cn("font-brand text-2xl tracking-[0.08em] flex items-center", className)}>
        {text}
      </h1>
    )
  }

  return (
    <h1
      className={cn(
        "group font-brand text-2xl tracking-[0.08em] flex items-center justify-center",
        className
      )}
    >
      <span className="relative inline-block">
        {/* base text */}
        <span className="relative z-10 text-current">
          {text.split("").map((ch, i) => (
            <span
              key={i}
              className={cn(
                "inline opacity-0 translate-y-[2px]",
                // play on mount
                "animate-[hex-in_520ms_steps(2,end)_forwards]",
                // replay on hover
                "group-hover:animate-[hex-in_520ms_steps(2,end)_forwards]",
                "motion-reduce:opacity-100 motion-reduce:translate-y-0"
              )}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {ch}
            </span>
          ))}
        </span>

        {/* RGB ghost layers */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0 select-none opacity-0",
            // mount
            "animate-[ghost-on_900ms_ease-out_forwards]",
            // hover replay
            "group-hover:animate-[ghost-on_900ms_ease-out_forwards]"
          )}
        >
          <span className="absolute inset-0 translate-x-[1px] translate-y-[3px] text-red-500/70 mix-blend-screen">
            {text}
          </span>
          <span className="absolute inset-0 -translate-x-[1px] text-cyan-400/70 mix-blend-screen">
            {text}
          </span>
        </span>
      </span>
    </h1>
  )
}

export const Logo: FunctionComponent<{
  inline?: boolean
  // currentSnapshot?: BinarySnapshot | null
  showHistogram?: boolean
  onShowHistogramChange?: (show: boolean) => void
  onChangeInput: OnHexedInputChange
}> = ({
  inline = false,
  showHistogram: controlledShowHistogram,
  onShowHistogramChange: controlledOnShowHistogramChange,
  onChangeInput
}) => {
    const { input: { file } } = useHexedInputContext()
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
            <Button variant="ghost" size="sm">
              <MenuIcon />
              {file ? <Brand className="text-sm" /> : null}
            </Button>
          </DropdownMenuTrigger>
          <Menu
            showHistogram={showHistogram}
            onShowHistogramChange={onShowHistogramChange}
            onChangeInput={onChangeInput}
          />
        </DropdownMenu>
      </div>
    )
  }
