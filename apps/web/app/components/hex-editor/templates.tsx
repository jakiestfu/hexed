import { useRef, useEffect } from "react";
import type { FunctionComponent, RefObject } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@hexed/ui";
import { X, Maximize2 } from "lucide-react";
import { usePIP } from "~/hooks/use-pip";
import type { TemplatesProps } from "./types";

export const Templates: FunctionComponent<TemplatesProps> = ({
  onClose,
  onPIPStateChange,
}) => {
  const templatesRef = useRef<HTMLDivElement>(null);
  const { isPIPActive, stylesLoaded, togglePIP, isSupported } = usePIP(
    templatesRef as RefObject<HTMLElement>
  );

  // Notify parent component when PIP state changes
  useEffect(() => {
    onPIPStateChange?.(isPIPActive);
  }, [isPIPActive, onPIPStateChange]);

  return (
    <div
      ref={templatesRef}
      className="h-full"
      style={{
        visibility: isPIPActive && !stylesLoaded ? "hidden" : "visible",
      }}
    >
      <Card className="h-full flex flex-col p-0 rounded-none border-none bg-sidebar overflow-hidden gap-0">
        <CardHeader className="py-3! px-4 border-b shrink-0 gap-0 bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-sm font-medium shrink-0 flex-1">
                Templates
              </CardTitle>
            </div>
            {!isPIPActive && (
              <div className="flex items-center gap-2 shrink-0">
                {isSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePIP}
                    className="h-7 w-7 p-0"
                    aria-label="Open Picture-in-Picture window"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-7 w-7 p-0"
                    aria-label="Close templates"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {/* Content will be added later */}
        </CardContent>
      </Card>
    </div>
  );
};
