import { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedFileChange, UseHexedFile } from "../hooks/use-hexed-file"
import { STORAGE_KEYS, UseHexedSettings } from "../hooks/use-hexed-settings"
import { UseHexedState } from "../hooks/use-hexed-state"
import { DragDropProvider } from "./drag-drop-provider"
import { HexedFileProvider } from "./hexed-file-provider"
import { HexedSettingsProvider } from "./hexed-settings-provider"
import { HexedStateProvider } from "./hexed-state-provider"
import { ThemeProvider } from "./theme-provider"
import { WorkerProvider } from "./worker-provider"

export const HexedProviders: FunctionComponent<
  PropsWithChildren<{
    input: UseHexedFile[0]
    onChangeInput: OnHexedFileChange
    settings: UseHexedSettings
    state: UseHexedState[0]
  }>
> = ({ input, onChangeInput, settings, state, children }) => (
  <HexedSettingsProvider value={settings}>
    <HexedStateProvider value={state}>
      <ThemeProvider>
        <WorkerProvider>
          <DragDropProvider>
            <HexedFileProvider
              input={input}
              onChangeInput={onChangeInput}
            >
              {children}
            </HexedFileProvider>
          </DragDropProvider>
        </WorkerProvider>
      </ThemeProvider>
    </HexedStateProvider>
  </HexedSettingsProvider>
)
