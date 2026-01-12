"use client";

import { Button, DropdownMenu, DropdownMenuTrigger } from "@hexed/ui";
import { ChevronDown, Ghost } from "lucide-react";
import { FunctionComponent, ReactNode, useState } from "react";
import { cn } from "@hexed/ui";
import type { BinarySnapshot } from "@hexed/types";
import { LogoMenu, type LogoMenuItem } from "~/components/logo-menu";

export type { LogoMenuItem } from "~/components/logo-menu";

export type LogoProps = {
  menuItems?: LogoMenuItem[];
  githubUrl?: string;
  inline?: boolean;
  currentSnapshot?: BinarySnapshot | null;
  showHistogram?: boolean;
  onShowHistogramChange?: (show: boolean) => void;
};

export const Brand: FunctionComponent<{
  className?: string;
  glitch?: boolean;
}> = ({ className, glitch }) => (
  <div
    className={cn(
      "flex justify-center items-center gap-2 logo-container-inline",
      className
    )}
  >
    <Ghost />

    <div
      className={cn("font-mono font-bold", glitch && "glitch layers")}
      data-text="hexed"
    >
      <span>hexed</span>
    </div>
  </div>
);

export const Logo: FunctionComponent<LogoProps> = ({
  menuItems,
  githubUrl = "https://github.com/jakiestfu/hexed",
  inline = false,
  currentSnapshot,
  showHistogram: controlledShowHistogram,
  onShowHistogramChange: controlledOnShowHistogramChange,
}) => {
  const [internalShowHistogram, setInternalShowHistogram] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const showHistogram = controlledShowHistogram ?? internalShowHistogram;
  const onShowHistogramChange =
    controlledOnShowHistogramChange ?? setInternalShowHistogram;

  if (inline) return <Brand />;

  return (
    <div className="flex justify-center gap-2 logo-container">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <Ghost />
            <span className="font-mono font-bold">hexed</span>
            <ChevronDown className="opacity-50 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <LogoMenu
          menuItems={menuItems}
          githubUrl={githubUrl}
          currentSnapshot={currentSnapshot}
          showHistogram={showHistogram}
          onShowHistogramChange={onShowHistogramChange}
        />
      </DropdownMenu>
    </div>
  );
};
