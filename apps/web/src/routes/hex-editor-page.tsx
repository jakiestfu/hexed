import { useLocation, useNavigate, useParams } from "react-router-dom"

import {
  HexedEditor,
  HexedFileInput,
  HexedSettings,
  Theme,
  useHexedInput,
  useHexedSettings,
  Sidebar,
  SidebarPosition
} from "@hexed/editor"
import { useQueryParams } from "~/hooks/use-query-param-state"
import { useEffect, useMemo } from "react"

const isTheme: (value: string) => value is Theme = (value) => value === 'light' || value === 'dark' || value === 'system'
const isBoolean: (value: string) => value is 'true' | 'false' = (value) => value === 'true' || value === 'false'
const isSidebar: (value: string) => value is NonNullable<Sidebar> = (value) => value === 'templates' || value === 'strings' || value === 'interpreter' || value === null
const isSidebarPosition: (value: string) => value is SidebarPosition = (value) => value === 'left' || value === 'right'

export function HexEditorPage() {
  const queryParams = useQueryParams()
  const params = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const overrides = useMemo(() => {
    const temp: Partial<HexedSettings> = {}
    for (const [key, value] of Object.entries(queryParams)) {
      if (typeof value !== "string") continue
      switch (key) {
        case 'theme':
          if (isTheme(value)) {
            temp.theme = value
          }
          break
        case 'showAscii':
        case 'showChecksums':
        case 'showMemoryProfiler':
          if (isBoolean(value)) {
            temp[key] = value === 'true'
          }
          break

        case 'sidebar':
          if (isSidebar(value)) {
            temp.sidebar = value as Sidebar
            break
          }
          break
        case 'sidebarPosition':
          if (isSidebarPosition(value)) {
            temp.sidebarPosition = value
          }
          break

        default:
          break
      }
    }
    return temp
  }, [queryParams])


  const [input, setInput] = useHexedInput(params.id)
  const settings = useHexedSettings(overrides)

  const inputText = queryParams.params.input
  useEffect(() => {
    if (location.pathname !== '/') return
    if (!inputText) {
      if (input.file) {
        setInput(null)
      }
      return;
    }
    const read = async () => {
      const newInput = new TextEncoder().encode(inputText)
      if (!input.file) {
        setInput(newInput)
        return
      }
      const data = await input.file.arrayBuffer()
      const currentInputText = new TextDecoder().decode(data)

      if (inputText && currentInputText !== inputText) {
        setInput(newInput)
      }
    }
    read()
  }, [inputText, input.file, pathname])

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
      />
    </div>
  )
}
