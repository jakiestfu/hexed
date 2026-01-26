"use client"

import type { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedFileChange, UseHexedFile } from "../../hooks/use-hexed-file"
import { UseHexedSettings } from "../../hooks/use-hexed-settings"
import { HexedState, UseHexedState } from "../../hooks/use-hexed-state"
import { HexedProviders } from "../../providers"
import type { EditorProps } from "../../types"
import { Editor } from "./editor"

export const HexedEditor: FunctionComponent<
  PropsWithChildren<
    {
      input: UseHexedFile[0]
      onChangeInput: OnHexedFileChange
      settings: UseHexedSettings
      state: HexedState
    } & EditorProps
  >
> = ({ input, onChangeInput, settings, state, ...props }) => (
  <HexedProviders
    input={input}
    onChangeInput={onChangeInput}
    settings={settings}
    state={state}
  >
    <Editor {...props} />
  </HexedProviders>
)
