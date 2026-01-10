import { useRef, useEffect, useState } from "react";
import type { FunctionComponent, RefObject } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@hexed/ui";
import { X, Maximize2, FileCode } from "lucide-react";
import { usePIP } from "~/hooks/use-pip";
import type { TemplatesProps } from "./types";
import { TemplatesCombobox } from "./templates-combobox";
import { load } from "@hexed/binary-templates";

// import Id3v23 from "@hexed/binary-templates/media/id3v2_3.js";

export const Templates: FunctionComponent<TemplatesProps> = ({
  onClose,
  onPIPStateChange,
}) => {
  const templatesRef = useRef<HTMLDivElement>(null);
  const { isPIPActive, stylesLoaded, togglePIP, isSupported } = usePIP(
    templatesRef as RefObject<HTMLElement>
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    name: string;
    title: string;
    path: string;
  } | null>(null);

  // Notify parent component when PIP state changes
  useEffect(() => {
    onPIPStateChange?.(isPIPActive);
  }, [isPIPActive, onPIPStateChange]);

  const handleTemplateSelect = async (entry: {
    name: string;
    title: string;
    path: string;
  }) => {
    setSelectedTemplate(entry);
    try {
      // const parserClass = await import("@hexed/binary-templates/media/id3v2_3.js");
      const ParserClass = await load(entry.path);

      // console.log("Loaded parser:", parserClass, templates);
    } catch (error) {
      console.error("Failed to load parser:", error);
    }
    // console.log("Id3v23", Id3v23.Id3v23);
  };

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
        <CardContent className="p-4 flex-1 overflow-y-auto">
          <TemplatesCombobox
            open={commandOpen}
            onOpenChange={setCommandOpen}
            onTemplateSelect={handleTemplateSelect}
            placeholder="Search templates..."
            className="w-full"
          />
          {selectedTemplate === null ? (
            <Empty className="mt-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCode className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>No template selected</EmptyTitle>
                <EmptyDescription>
                  Select a template from the dropdown above to parse binary data
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Template ID</div>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {selectedTemplate.name}
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
