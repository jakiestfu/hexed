
import {
  useHexedFile,
  useHexedSettings,
  Brand,
  HexedProviders,
  useHexedState
} from "@hexed/editor"
import { useMemo } from "react"
import { useQueryParams } from "~/hooks/use-query-param-state"
import { queryParamsToOptions } from "~/utils/query-params-to-options"

export function HexedBrandRoute() {

  const queryParams = useQueryParams()

  const overrides = useMemo(
    () => queryParamsToOptions(queryParams.params),
    [queryParams]
  )

  const [input, setInput] = useHexedFile()
  const settings = useHexedSettings(overrides)
  const [state] = useHexedState()

  return (
    <HexedProviders input={input} onChangeInput={setInput} settings={settings} state={state}>
      <div className="flex flex-col h-dvh items-center justify-center bg-muted/30">
        <Brand />
      </div>
    </HexedProviders>
  )
}
