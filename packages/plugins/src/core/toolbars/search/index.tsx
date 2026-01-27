import { useEffect, useRef } from "react"
import { Search } from "lucide-react"

import { createHexedEditorPlugin } from "../../.."
import { HexedPluginComponent } from "../../../types"
import { FindInput } from "./find-input"

export const SearchToolbar: HexedPluginComponent = ({
  state: { handleMatchFound },
  settings,
  file
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when toolbar is shown
  useEffect(() => {
    if (settings.toolbar === "search" && inputRef.current) {
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [settings.toolbar])

  return (
    <FindInput
      ref={inputRef}
      file={file}
      onMatchFound={handleMatchFound}
    />
  )
}

export const searchPlugin = createHexedEditorPlugin({
  type: "toolbar",
  id: "search",
  title: "Search",
  icon: Search,
  component: SearchToolbar
})
