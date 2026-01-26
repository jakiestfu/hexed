import { useEffect, useMemo } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import {
  HexedEditor,
  HexedFileInput,
  supportsFileSystemAccess,
  useHexedFile,
  useHexedSettings,
  useHexedState
} from "@hexed/editor"

import { useQueryParams } from "~/hooks/use-query-param-state"
import { queryParamsToOptions } from "~/utils/query-params-to-options"

export function HexEditorPage() {
  const queryParams = useQueryParams()
  const params = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const overrides = useMemo(
    () => queryParamsToOptions(queryParams.params),
    [queryParams]
  )

  const [input, setInput] = useHexedFile(params.id)
  const settings = useHexedSettings(overrides)
  const state = useHexedState()

  const inputText = queryParams.params.input
  useEffect(() => {
    if (pathname !== "/" || (pathname === "/" && !supportsFileSystemAccess()))
      return

    if (!inputText) {
      if (input.hexedFile) {
        setInput(null)
      }
      return
    }
    const read = async () => {
      const newInput = new TextEncoder().encode(inputText)
      if (!input.hexedFile) {
        setInput(newInput)
        return
      }
      // Ensure range is loaded before reading
      const range = { start: 0, end: input.hexedFile.size }
      if (!input.hexedFile.isRangeLoaded(range)) {
        await input.hexedFile.ensureRange(range)
      }
      // Read bytes from HexedFile
      const data = input.hexedFile.readBytes(0, input.hexedFile.size)
      if (data) {
        const currentInputText = new TextDecoder().decode(data)

        if (inputText && currentInputText !== inputText) {
          setInput(newInput)
        }
      }
    }
    read()
  }, [inputText, input.hexedFile, pathname, setInput])

  const onChangeInput = (newInput: HexedFileInput) => {
    if (newInput === null) {
      navigate("/")
      setInput(null)
      return
    }
    if (typeof newInput === "string") {
      navigate(`/edit/${newInput}`)
      return
    }
    setInput(newInput)
  }

  return (
    <div className="flex flex-col h-dvh">
      <HexedEditor
        input={input}
        fileSource="file-system"
        onChangeInput={onChangeInput}
        settings={settings}
        state={state}
      />
    </div>
  )
}
