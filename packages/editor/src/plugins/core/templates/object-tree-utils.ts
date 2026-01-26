import { formatBytesPreview, formatHex } from "@hexed/file/formatter"

export type TreeNodeType =
  | "object"
  | "array"
  | "primitive"
  | "typedArray"
  | "undefined"

export interface TreeNode {
  name: string
  type: TreeNodeType
  value?: any
  className?: string // For Kaitai Struct class names
  children?: TreeNode[]
  isExpanded?: boolean
  path: string[]
  // For primitives
  primitiveValue?: any
  enumStringValue?: string
  // For typed arrays
  bytesPreview?: string
  // For arrays
  arrayLength?: number
  // Original Kaitai-parsed node object (for accessing _debug)
  originalNode?: any
  // Parent original node (for accessing parent's _debug for array items)
  parentOriginalNode?: any
  // Root original node (for accessing root._debug)
  rootOriginalNode?: any
}

function getObjectType(obj: any): TreeNodeType {
  if (obj instanceof Uint8Array) return "typedArray"
  if (obj === null || obj === undefined) return "undefined"
  if (typeof obj !== "object") return "primitive"
  if (Array.isArray(obj)) return "array"
  return "object"
}

export function convertKaitaiToTree(
  obj: any,
  name: string = "root",
  path: string[] = [],
  parentOriginalNode?: any,
  rootOriginalNode?: any
): TreeNode {
  const type = getObjectType(obj)
  // Use provided root or set current as root if this is the root node
  const rootNode = rootOriginalNode || (name === "root" ? obj : undefined)
  const node: TreeNode = {
    name,
    type,
    path: [...path, name],
    originalNode: obj,
    parentOriginalNode,
    rootOriginalNode: rootNode
  }

  switch (type) {
    case "primitive":
      node.primitiveValue = obj
      // Check if it's an enum (you might need to pass enum info separately)
      if (typeof obj === "number" && Number.isInteger(obj)) {
        node.value = formatHex(obj)
      } else {
        node.value = String(obj)
      }
      break

    case "typedArray":
      node.bytesPreview = formatBytesPreview(obj as Uint8Array)
      node.value = `[${(obj as Uint8Array).length} bytes]`
      break

    case "array":
      const arr = obj as any[]
      node.arrayLength = arr.length
      node.children = arr.map((item, i) =>
        convertKaitaiToTree(item, String(i), node.path, obj, rootNode)
      )
      break

    case "object":
      node.className = obj.constructor?.name || "Object"
      node.children = []

      // Get all properties (excluding private/internal ones)
      const keys = Object.keys(obj).filter((key) => !key.startsWith("_"))

      for (const key of keys) {
        try {
          const value = obj[key]
          // Skip functions and internal properties
          if (typeof value === "function" || key === "constructor") continue

          node.children.push(
            convertKaitaiToTree(value, key, node.path, obj, rootNode)
          )
        } catch (e) {
          // Handle lazy-loaded properties that throw errors
          node.children.push({
            name: key,
            type: "undefined",
            path: [...node.path, key],
            value: "<lazy instance>",
            parentOriginalNode: obj,
            rootOriginalNode: rootNode
          })
        }
      }
      break

    case "undefined":
      node.value = "<no value>"
      break
  }

  return node
}
