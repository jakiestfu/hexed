import { HexedPlugin } from "../types"
import { interpreterPlugin } from "./interpreter"

export const plugins: HexedPlugin[] = [
  interpreterPlugin
]