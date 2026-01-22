"use client"

import type { FunctionComponent, PropsWithChildren } from "react"

import type { EditorProps } from "../../types"
import { HexedProviders } from "../../providers"
import { Editor } from "./editor"
import { UseHexedSettings } from "../../hooks/use-hexed-settings"
import { OnHexedInputChange, UseHexedInput } from "../../hooks/use-hexed-input"

type F = {
  input: UseHexedInput[0]
  onChangeInput: OnHexedInputChange
  settings: UseHexedSettings;
} & EditorProps

export const HexedEditor: FunctionComponent<PropsWithChildren<F>> = ({ input, onChangeInput, settings, ...props }) => (
  <HexedProviders input={input} onChangeInput={onChangeInput} settings={settings}>
    <Editor {...props} />
  </HexedProviders>
)