import { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedInputChange, UseHexedInput } from "../hooks/use-hexed-input"
import { STORAGE_KEYS, UseHexedSettings } from "../hooks/use-hexed-settings"
import { DragDropProvider } from "./drag-drop-provider"
import { HexedInputProvider } from "./hex-input-provider"
import { HexedSettingsProvider } from "./hexed-settings-provider"
import { WorkerProvider } from "./worker-provider"
import { ThemeProvider } from "./theme-provider"

export const HexedProviders: FunctionComponent<
  PropsWithChildren<{
    input: UseHexedInput[0]
    onChangeInput: OnHexedInputChange
    settings: UseHexedSettings
  }>
> = ({ input, onChangeInput, settings, children }) => (
  <HexedSettingsProvider value={settings}>
    <ThemeProvider>
      <WorkerProvider>
        <DragDropProvider>
          <HexedInputProvider
            input={input}
            onChangeInput={onChangeInput}
          >
            {children}
          </HexedInputProvider>
        </DragDropProvider>
      </WorkerProvider>
    </ThemeProvider>
  </HexedSettingsProvider>
)
