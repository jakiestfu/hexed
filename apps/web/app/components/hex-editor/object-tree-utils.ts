import { formatHex, formatBytesPreview } from "@hexed/binary-utils/formatter";

export type TreeNodeType =
  | "object"
  | "array"
  | "primitive"
  | "typedArray"
  | "undefined";

export interface TreeNode {
  name: string;
  type: TreeNodeType;
  value?: any;
  className?: string; // For Kaitai Struct class names
  children?: TreeNode[];
  isExpanded?: boolean;
  path: string[];
  // For primitives
  primitiveValue?: any;
  enumStringValue?: string;
  // For typed arrays
  bytesPreview?: string;
  // For arrays
  arrayLength?: number;
}

function getObjectType(obj: any): TreeNodeType {
  if (obj instanceof Uint8Array) return "typedArray";
  if (obj === null || obj === undefined) return "undefined";
  if (typeof obj !== "object") return "primitive";
  if (Array.isArray(obj)) return "array";
  return "object";
}

export function convertKaitaiToTree(
  obj: any,
  name: string = "root",
  path: string[] = []
): TreeNode {
  const type = getObjectType(obj);
  const node: TreeNode = {
    name,
    type,
    path: [...path, name],
  };

  switch (type) {
    case "primitive":
      node.primitiveValue = obj;
      // Check if it's an enum (you might need to pass enum info separately)
      if (typeof obj === "number" && Number.isInteger(obj)) {
        node.value = formatHex(obj);
      } else {
        node.value = String(obj);
      }
      break;

    case "typedArray":
      node.bytesPreview = formatBytesPreview(obj as Uint8Array);
      node.value = `[${(obj as Uint8Array).length} bytes]`;
      break;

    case "array":
      const arr = obj as any[];
      node.arrayLength = arr.length;
      node.children = arr.map((item, i) =>
        convertKaitaiToTree(item, String(i), node.path)
      );
      break;

    case "object":
      node.className = obj.constructor?.name || "Object";
      node.children = [];

      // Get all properties (excluding private/internal ones)
      const keys = Object.keys(obj).filter((key) => !key.startsWith("_"));

      for (const key of keys) {
        try {
          const value = obj[key];
          // Skip functions and internal properties
          if (typeof value === "function" || key === "constructor") continue;

          node.children.push(convertKaitaiToTree(value, key, node.path));
        } catch (e) {
          // Handle lazy-loaded properties that throw errors
          node.children.push({
            name: key,
            type: "undefined",
            path: [...node.path, key],
            value: "<lazy instance>",
          });
        }
      }
      break;

    case "undefined":
      node.value = "<no value>";
      break;
  }

  return node;
}
