import { useEffect, useState } from "react"
import type { FunctionComponent, ReactNode } from "react"

import { cn } from "@hexed/ui"

export type HexToolbarProps = {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  isElectron?: boolean | (() => boolean) // Optional prop to check if running in Electron
}

/**
 * Checks if the app is running in Electron
 * This is a minimal implementation - can be overridden via props
 */
function isElectron(): boolean {
  return typeof window !== "undefined" && (window as any).electron !== undefined
}

export const HexToolbar: FunctionComponent<HexToolbarProps> = ({
  left,
  center,
  right,
  isElectron: isElectronProp
}) => {
  const [isInElectron, setIsInElectron] = useState(false)

  useEffect(() => {
    const inElectron = typeof isElectronProp === "function"
      ? isElectronProp()
      : isElectronProp !== undefined
        ? isElectronProp
        : isElectron()
    setIsInElectron(inElectron)

    if (inElectron) {
      // Add global style to ensure interactive elements are not draggable
      const style = document.createElement("style")
      style.textContent = `
        [data-electron-drag-region] button,
        [data-electron-drag-region] input,
        [data-electron-drag-region] select,
        [data-electron-drag-region] a,
        [data-electron-drag-region] [role="button"],
        [data-electron-drag-region] [role="menuitem"] {
          -webkit-app-region: no-drag !important;
        }
      `
      document.head.appendChild(style)

      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isElectronProp])

  return (
    <div
      data-electron-drag-region={isInElectron ? "" : undefined}
      className="flex items-center justify-between p-4 border-b"
      style={
        isInElectron
          ? {
              WebkitAppRegion: "drag"
            }
          : undefined
      }
    >
      <div className="flex items-start min-w-0 flex-1">{left}</div>
      {center && (
        <div className="flex items-center grow justify-center">{center}</div>
      )}
      {right && (
        <div className="flex items-end justify-end flex-1 min-w-0">{right}</div>
      )}
    </div>
  )
}
