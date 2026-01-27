import { pluginsWithHotkeys } from ".."
import { HexedPlugin } from "../types"
import { fileSizePlugin } from "./labels/file-size"
import { memoryProfilerPlugin } from "./labels/memory-profiler"
import { interpreterPlugin } from "./sidebars/interpreter"
import { stringsPlugin } from "./sidebars/strings"
import { templatesPlugin } from "./sidebars/templates"
import { searchPlugin } from "./toolbars/search"
import { autocorrelationPlugin } from "./visualizations/autocorrelation"
import { byteFrequencyPlugin } from "./visualizations/byte-frequency"
import { byteScatterPlugin } from "./visualizations/byte-scatter"
import { chiSquarePlugin } from "./visualizations/chi-square"
import { entropyPlugin } from "./visualizations/entropy"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  searchPlugin,
  fileSizePlugin,
  memoryProfilerPlugin,
  byteFrequencyPlugin,
  entropyPlugin,
  chiSquarePlugin,
  autocorrelationPlugin,
  byteScatterPlugin
])
