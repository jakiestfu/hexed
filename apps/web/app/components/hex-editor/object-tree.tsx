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
};

interface TreeNodeViewProps {
  node: TreeNode;
  level?: number;
  onNodeSelect?: (node: TreeNode) => void;
}

const TreeNodeView: FunctionComponent<TreeNodeViewProps> = ({
  node,
  level = 0,
  onNodeSelect,
}) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;
  const indent = level * 20;

  const renderValue = () => {
    switch (node.type) {
      case "object":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-blue-400">{node.name}</span>{" "}
            <span className="text-green-400">[{node.className}]</span>
          </span>
        );

      case "array":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-blue-400">{node.name}</span>{" "}
            <span className="text-muted-foreground">({node.arrayLength})</span>
          </span>
        );

      case "typedArray":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-blue-400">{node.name}</span>
            {" = "}
            <span className="text-muted-foreground">{node.bytesPreview}</span>
          </span>
        );

      case "primitive":
        return (
          <span className="text-sm whitespace-nowrap">
            <span className="text-blue-400">{node.name}</span>
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
        onClick={() => onNodeSelect?.(node)}
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
        onClick={() => onNodeSelect?.(node)}
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
        <TreeNodeView node={rootNode} />
      </div>
    </div>
  );
};
