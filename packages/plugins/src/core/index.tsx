import { pluginsWithHotkeys } from ".."
import { HexedPlugin } from "../types"
import { fileSizePlugin } from "./labels/file-size"
import { memoryProfilerPlugin } from "./labels/memory-profiler"
import { interpreterPlugin } from "./sidebars/interpreter"
import { stringsPlugin } from "./sidebars/strings"
import { templatesPlugin } from "./sidebars/templates"
import { searchPlugin } from "./toolbars/search"
import { autocorrelationPreset } from "./visualizations/autocorrelation"
import { byteFrequencyPreset } from "./visualizations/byte-frequency"
import { byteScatterPreset } from "./visualizations/byte-scatter"
import { chiSquarePreset } from "./visualizations/chi-square"
import { entropyPreset } from "./visualizations/entropy"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  searchPlugin,
  fileSizePlugin,
  memoryProfilerPlugin
])

export const visualizations = [
  byteFrequencyPreset,
  entropyPreset,
  chiSquarePreset,
  autocorrelationPreset,
  byteScatterPreset
]
