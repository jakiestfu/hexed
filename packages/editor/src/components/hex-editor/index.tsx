"use client"

import type { FunctionComponent, PropsWithChildren } from "react"

import { OnHexedInputChange, UseHexedInput } from "../../hooks/use-hexed-input"
import { UseHexedSettings } from "../../hooks/use-hexed-settings"
import { HexedProviders } from "../../providers"
import type { EditorProps } from "../../types"
import { Editor } from "./editor"

export const HexedEditor: FunctionComponent<
  PropsWithChildren<
    {
      input: UseHexedInput[0]
      onChangeInput: OnHexedInputChange
      settings: UseHexedSettings
    } & EditorProps
  >
> = ({ input, onChangeInput, settings, ...props }) => (
  <HexedProviders
    input={input}
    onChangeInput={onChangeInput}
    settings={settings}
  >
    <Editor {...props} />
  </HexedProviders>
)
