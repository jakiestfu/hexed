import { BarChart } from "lucide-react"

import { createHexedEditorPlugin } from "../.."
import { HexedPluginComponent } from "../../types"

// import { HexedVisualizationPluginComponent } from "../../types"

export const ByteFrequency: HexedPluginComponent<"visualization"> = ({
  foo
}) => {
  return (
    <div>
      <h1>Byte Frequency</h1>
    </div>
  )
}

export const byteFrequencyPlugin = createHexedEditorPlugin({
  type: "visualization",
  id: "byte-frequency",
  title: "Byte Frequency",
  icon: BarChart,
  component: ByteFrequency
})
