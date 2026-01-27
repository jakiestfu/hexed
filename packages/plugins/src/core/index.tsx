import { pluginsWithHotkeys } from ".."
import { HexedPlugin } from "../types"
import { fileSizePlugin } from "./labels/file-size"
import { memoryProfilerPlugin } from "./labels/memory-profiler"
import { interpreterPlugin } from "./sidebars/interpreter"
import { stringsPlugin } from "./sidebars/strings"
import { templatesPlugin } from "./sidebars/templates"
import { searchPlugin } from "./toolbars/search"
import { byteFrequencyPlugin } from "./visualizations/byte-frequency"
import { entropyPlugin } from "./visualizations/entropy"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  searchPlugin,
  fileSizePlugin,
  memoryProfilerPlugin,
  byteFrequencyPlugin,
  entropyPlugin
])
