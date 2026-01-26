import { pluginsWithHotkeys } from ".."
import { HexedPlugin } from "../types"
import { interpreterPlugin } from "./interpreter"
import { stringsPlugin } from "./strings"
import { templatesPlugin } from "./templates"
import { searchPlugin } from "./search"
import { fileSizePlugin } from "./file-size"
import { memoryProfilerPlugin } from "./memory-profiler"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin,
  searchPlugin,
  fileSizePlugin,
  memoryProfilerPlugin,
])
