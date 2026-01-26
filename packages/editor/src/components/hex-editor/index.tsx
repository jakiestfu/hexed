"use client"

import type { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedFileChange, UseHexedFile } from "../../hooks/use-hexed-file"
import { UseHexedSettings } from "../../hooks/use-hexed-settings"
import { UseHexedState } from "../../hooks/use-hexed-state"
import { HexedProviders } from "../../providers"
import type { EditorProps } from "../../types"
import { Editor } from "./editor"

export const HexedEditor: FunctionComponent<
  PropsWithChildren<
    {
      input: UseHexedFile[0]
      onChangeInput: OnHexedFileChange
      settings: UseHexedSettings
      state: UseHexedState[0]
      onStateChange: UseHexedState[1]
    } & EditorProps
  >
> = ({ input, onChangeInput, settings, state, onStateChange, ...props }) => (
  <HexedProviders
    input={input}
    onChangeInput={onChangeInput}
    settings={settings}
    state={state}
  >
    <Editor {...props} />
  </HexedProviders>
)
