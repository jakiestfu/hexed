import * as React from "react"
import { useTheme } from "next-themes"
import { useNavigate, useParams } from "react-router-dom"

import { HexedFileInput, HexedEditor, useHexedInput, useHexedSettings } from "@hexed/editor"

import packageJson from "../../package.public.json"

export function HexEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [input, setInput] = useHexedInput(params.id)
  const settings = useHexedSettings()

  const handleClose = React.useCallback(() => {
    navigate("/")
  }, [navigate])

  const onChangeInput = React.useCallback(
    (newInput: HexedFileInput) => {
      if (newInput === null) {
        navigate("/")
        return
      }
      if (typeof newInput === "string") {
        navigate(`/edit/${newInput}`)
        return
      }
      setInput(newInput)
    },
    [navigate]
  )

  console.log("input", input)
  return (
    <div className="flex flex-col h-screen">
      <HexedEditor
        input={input}
        fileSource="file-system"
        onChangeInput={onChangeInput}
        settings={settings}
        theme={theme}
        setTheme={setTheme}
        packageInfo={packageJson}
      />
    </div>
  )
}
