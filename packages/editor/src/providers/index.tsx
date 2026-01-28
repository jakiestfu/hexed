import { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedFileChange, UseHexedFile } from "../hooks/use-hexed-file"
import { UseHexedSettings } from "../hooks/use-hexed-settings"
import { HexedState } from "../hooks/use-hexed-state"
import { DragDropProvider } from "./drag-drop-provider"
import { HexedFileProvider } from "./hexed-file-provider"
import { HexedSettingsProvider } from "./hexed-settings-provider"
import { HexedStateProvider } from "./hexed-state-provider"
import { ThemeProvider } from "./theme-provider"

export const HexedProviders: FunctionComponent<
  PropsWithChildren<{
    input: UseHexedFile[0]
    onChangeInput: OnHexedFileChange
    settings: UseHexedSettings
    state: HexedState
  }>
> = ({ input, onChangeInput, settings, state, children }) => (
  <HexedSettingsProvider value={settings}>
    <HexedStateProvider value={state}>
      <ThemeProvider>
        <DragDropProvider>
          <HexedFileProvider
            input={input}
            onChangeInput={onChangeInput}
          >
            {children}
          </HexedFileProvider>
        </DragDropProvider>
      </ThemeProvider>
    </HexedStateProvider>
  </HexedSettingsProvider>
)
