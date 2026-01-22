import { useTheme } from "next-themes"
import { useNavigate, useParams } from "react-router-dom"

import {
  HexedEditor,
  HexedFileInput,
  useHexedInput,
  useHexedSettings
} from "@hexed/editor"

export function HexEditorPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const [input, setInput] = useHexedInput(params.id)
  const settings = useHexedSettings()

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
    <div className="flex flex-col h-screen">
      <HexedEditor
        input={input}
        fileSource="file-system"
        onChangeInput={onChangeInput}
        settings={settings}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  )
}
