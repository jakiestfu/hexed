import { useState } from "react";
import type { FunctionComponent } from "react";
import type { KsySchema } from "@hexed/binary-templates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@hexed/ui";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@hexed/ui";
import { convertKaitaiToTree, type TreeNode } from "./object-tree-utils";

export type ObjectTreeProps = {
  parsedData: Record<string, unknown> | null;
  spec: KsySchema | null;
  onNodeSelect?: (range: { start: number; end: number }) => void;
};

interface TreeNodeViewProps {
  node: TreeNode;
  level?: number;
  onNodeSelect?: (range: { start: number; end: number }) => void;
}

const TreeNodeView: FunctionComponent<TreeNodeViewProps> = ({
  node,
  level = 0,
  onNodeSelect,
}) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 20;

  const handleNodeClick = () => {
    if (!onNodeSelect) return;

    // Try to extract start/end from _debug
    let debugInfo: { start?: number; end?: number } | undefined;
    console.log("NODE", node);
    // Use root's _debug and path to navigate to the correct debug info
    if (node.rootOriginalNode?._debug) {
      const rootDebug = node.rootOriginalNode._debug;
      const path = node.path;

      // Handle root node click (path is just ["root"])
      if (path.length === 1 && path[0] === "root") {
        // Root node itself - check if root debug has start/end
        if (
          typeof rootDebug.start === "number" &&
          typeof rootDebug.end === "number"
        ) {
          debugInfo = { start: rootDebug.start, end: rootDebug.end };
        }
      } else if (path.length > 1 && path[0] === "root") {
        // Navigate through the path, handling arrays specially
        // Path is like ["root", "chunks", "0"] or ["root", "magic"]
        let current: any = rootDebug;

        // Navigate through the path, handling arrays specially
        for (let i = 1; i < path.length; i++) {
          const segment = path[i];
          const isArrayIndex = !isNaN(Number(segment));

          if (isArrayIndex && current.arr) {
            // This is an array index, access arr[index]
            const index = Number(segment);
            if (Array.isArray(current.arr) && current.arr[index]) {
              current = current.arr[index];
            } else {
              current = undefined;
              break;
            }
          } else if (current[segment]) {
            // Regular property access
            current = current[segment];
          } else {
            current = undefined;
            break;
          }
        }

        if (
          current &&
          typeof current.start === "number" &&
          typeof current.end === "number"
        ) {
          debugInfo = current;
        }
      }
    }

    // Fallback: try parent's _debug for direct properties
    if (!debugInfo && node.parentOriginalNode?._debug) {
      const parentDebug = node.parentOriginalNode._debug;
      const nodeName = node.name;

      // Check if this is an array item (numeric name)
      if (!isNaN(Number(nodeName)) && parentDebug.arr) {
        const index = Number(nodeName);
        if (Array.isArray(parentDebug.arr) && parentDebug.arr[index]) {
          debugInfo = parentDebug.arr[index];
        }
      } else if (parentDebug[nodeName]) {
        // Regular property
        debugInfo = parentDebug[nodeName];
      }
    }

    // Fallback: try node's own _debug if it exists (for root node)
    if (!debugInfo && node.originalNode?._debug) {
      const nodeDebug = node.originalNode._debug;
      // Check if this node's name exists in the debug
      if (nodeDebug[node.name]) {
        debugInfo = nodeDebug[node.name];
      } else if (nodeDebug.start !== undefined && nodeDebug.end !== undefined) {
        // Node itself has debug info (might be root or a direct property)
        debugInfo = nodeDebug;
      }
    }

    // If we found valid debug info, call the callback
    // Note: end is exclusive in _debug, so subtract 1 to make it inclusive for selection
    // ioOffset represents the base offset in the IO stream, so add it to start and end
    if (
      debugInfo &&
      typeof debugInfo.start === "number" &&
      typeof debugInfo.end === "number"
    ) {
      const ioOffset =
        typeof debugInfo.ioOffset === "number" ? debugInfo.ioOffset : 0;
      const start = debugInfo.start + ioOffset;
      const end = debugInfo.end + ioOffset - 1; // Subtract 1 because end is exclusive
      onNodeSelect({ start, end });
    }
  };

  const renderValue = () => {
    switch (node.type) {
      case "object":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-primary">{node.name}</span>{" "}
            <span className="text-muted-foreground">[{node.className}]</span>
          </span>
        );

      case "array":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-primary">{node.name}</span>{" "}
            <span className="text-muted-foreground">({node.arrayLength})</span>
          </span>
        );

      case "typedArray":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-primary">{node.name}</span>
            {" = "}
            <span className="text-muted-foreground">{node.bytesPreview}</span>
          </span>
        );

      case "primitive":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-primary">{node.name}</span>
            {" = "}
            <span className="font-bold text-foreground">
              {node.value}
              {typeof node.primitiveValue === "number" &&
                Number.isInteger(node.primitiveValue) && (
                  <span className="text-muted-foreground ml-1">
                    = {node.primitiveValue}
                  </span>
                )}
            </span>
          </span>
        );

      default:
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {node.name} = {node.value || "<no value>"}
          </span>
        );
    }
  };

  if (!hasChildren) {
    return (
      <div
        className={cn(
          "flex items-center py-1 px-2 hover:bg-muted cursor-pointer select-none",
          "font-mono text-xs whitespace-nowrap min-w-fit"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleNodeClick}
      >
        <span className="w-4 shrink-0" /> {/* Spacer for alignment */}
        {renderValue()}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex items-center w-full py-1 px-2 hover:bg-muted cursor-pointer select-none",
          "font-mono text-xs whitespace-nowrap min-w-fit"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleNodeClick}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 mr-1 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 mr-1 text-muted-foreground shrink-0" />
        )}
        {renderValue()}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {node.children?.map((child, index) => (
          <TreeNodeView
            key={`${child.path.join(".")}-${index}`}
            node={child}
            level={level + 1}
            onNodeSelect={onNodeSelect}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ObjectTree: FunctionComponent<ObjectTreeProps> = ({
  parsedData,
  spec,
  onNodeSelect,
}) => {
  if (!parsedData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No parsed data available
      </div>
    );
  }

  const rootNode = convertKaitaiToTree(parsedData, "root");

  return (
    <div className="bg-sidebar text-foreground rounded-lg h-full font-mono overflow-auto">
      <div className="min-w-fit p-4">
        <TreeNodeView node={rootNode} onNodeSelect={onNodeSelect} />
      </div>
    </div>
  );
};
