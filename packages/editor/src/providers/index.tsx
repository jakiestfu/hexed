import { FunctionComponent, PropsWithChildren, ReactNode } from "react";
import { HexedInputProvider } from "./hex-input-provider";
import { HexedSettingsProvider } from "./hexed-settings-provider";
import { UseHexedSettings } from "../hooks/use-hexed-settings";
import { HexedFileInput } from "../types";
import { DragDropProvider } from "./drag-drop-provider";
import { WorkerProvider } from "./worker-provider";
import { OnHexedInputChange, UseHexedInput } from "../hooks/use-hexed-input";

export const HexedProviders: FunctionComponent<PropsWithChildren<{
  input: UseHexedInput[0]
  onChangeInput: OnHexedInputChange
  settings: UseHexedSettings
}>> = ({ input, onChangeInput, settings, children }) => (
  <WorkerProvider>
    <DragDropProvider>
      <HexedInputProvider input={input} onChangeInput={onChangeInput}>
        <HexedSettingsProvider value={settings}>
          {children}
        </HexedSettingsProvider>
      </HexedInputProvider>
    </DragDropProvider>
  </WorkerProvider>
)