import { pluginsWithHotkeys } from ".."
import { HexedPlugin } from "../types"
import { interpreterPlugin } from "./interpreter"
import { stringsPlugin } from "./strings"
import { templatesPlugin } from "./templates"

export const plugins: HexedPlugin[] = pluginsWithHotkeys([
  interpreterPlugin,
  stringsPlugin,
  templatesPlugin
])