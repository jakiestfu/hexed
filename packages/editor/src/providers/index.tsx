import { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedInputChange, UseHexedInput } from "../hooks/use-hexed-input"
import { STORAGE_KEYS, UseHexedSettings } from "../hooks/use-hexed-settings"
import { UseHexedState } from "../hooks/use-hexed-state"
import { DragDropProvider } from "./drag-drop-provider"
import { HexedInputProvider } from "./hex-input-provider"
import { HexedSettingsProvider } from "./hexed-settings-provider"
import { HexedStateProvider } from "./hexed-state-provider"
import { ThemeProvider } from "./theme-provider"
import { WorkerProvider } from "./worker-provider"

export const HexedProviders: FunctionComponent<
  PropsWithChildren<{
    input: UseHexedInput[0]
    onChangeInput: OnHexedInputChange
    settings: UseHexedSettings
    state: UseHexedState[0]
  }>
> = ({ input, onChangeInput, settings, state, children }) => (
  <HexedSettingsProvider value={settings}>
    <HexedStateProvider value={state}>
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
    </HexedStateProvider>
  </HexedSettingsProvider>
)
