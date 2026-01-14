import { useEffect, useState } from "react"
import type { FunctionComponent } from "react"
import {
  AlertCircle,
  ArrowLeftRight,
  FileCode,
  X
} from "lucide-react"

import { KsySchema, manifest, parse } from "@hexed/binary-templates"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@hexed/ui"

import { useSettings } from "../hooks/use-settings"
import { ObjectTree } from "./object-tree"
import { TemplatesCombobox } from "./templates-combobox"
import type { TemplatesProps } from "../types"

type TemplateEntry = {
  name: string
  title: string
  path: string
  extension?: string | string[]
}

// Type guard to check if an entry is a template (has title and path)
function isTemplate(entry: unknown): entry is TemplateEntry {
  if (typeof entry !== "object" || entry === null) {
    return false
  }
  const obj = entry as Record<string, unknown>
  return (
    "title" in obj &&
    "path" in obj &&
    "name" in obj &&
    typeof obj.title === "string" &&
    typeof obj.path === "string" &&
    typeof obj.name === "string"
  )
}

// Type guard to check if an entry is a category (has children)
function isCategory(
  entry: unknown
): entry is { name: string; children: unknown[] } {
  if (typeof entry !== "object" || entry === null) {
    return false
  }
  const obj = entry as Record<string, unknown>
  return (
    "children" in obj &&
    "name" in obj &&
    Array.isArray(obj.children) &&
    typeof obj.name === "string"
  )
}

// Helper function to recursively find a template by name in the manifest
function findTemplate(
  entries: unknown[],
  name: string
): TemplateEntry | undefined {
  for (const entry of entries) {
    if (isTemplate(entry) && entry.name === name) {
      return {
        name: entry.name,
        title: entry.title,
        path: entry.path,
        extension: entry.extension
      }
    }
    if (isCategory(entry)) {
      const found = findTemplate(entry.children, name)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

export const Templates: FunctionComponent<TemplatesProps> = ({
  data,
  filePath,
  onClose,
  onScrollToOffset,
  onSelectedOffsetRangeChange,
  selectedTemplateName: controlledTemplateName,
  onTemplateNameChange: controlledOnTemplateNameChange
}) => {
  const { toggleSidebarPosition } = useSettings()
  const [commandOpen, setCommandOpen] = useState(false)
  // Use controlled state if provided, otherwise use internal state
  const [internalTemplateValue, setInternalTemplateValue] = useState("")
  const templateValue =
    controlledTemplateName !== undefined
      ? controlledTemplateName
      : internalTemplateValue
  const setTemplateValue =
    controlledOnTemplateNameChange || setInternalTemplateValue
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateEntry | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(
    null
  )
  const [selectedSpec, setSelectedSpec] = useState<KsySchema | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Restore template from URL param on mount or when value changes
  useEffect(() => {
    if (templateValue) {
      const template = findTemplate(manifest, templateValue)
      if (template && selectedTemplate?.name !== template.name) {
        // Only update state, don't call handleTemplateSelect to avoid loop
        setSelectedTemplate(template)
        setParseError(null)

        if (data) {
          parse(template.path, data).then(
            ({ parsedData: result, spec, error }) => {
              if (spec) {
                setSelectedSpec(spec)
              } else {
                setSelectedSpec(null)
              }

              if (error) {
                console.error("Failed to parse data:", error)
                setParsedData(null)
                const errorMessage =
                  error instanceof Error ? error.message : String(error)
                setParseError(errorMessage)
              } else {
                setParsedData(result)
                setParseError(null)
              }
            }
          )
        } else {
          console.warn("No data available to parse")
          setParsedData(null)
        }
      }
    } else if (!templateValue && selectedTemplate) {
      setSelectedTemplate(null)
      setParsedData(null)
      setSelectedSpec(null)
      setParseError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateValue, data])

  const handleTemplateSelect = async (entry: TemplateEntry) => {
    setSelectedTemplate(entry)
    setTemplateValue(entry.name)
    setParseError(null)

    if (!data) {
      console.warn("No data available to parse")
      setParsedData(null)
      return
    }

    const { parsedData: result, spec, error } = await parse(entry.path, data)

    if (spec) {
      setSelectedSpec(spec)
    } else {
      setSelectedSpec(null)
    }

    if (error) {
      console.error("Failed to parse data:", error)
      setParsedData(null)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      setParseError(errorMessage)
    } else {
      setParsedData(result)
      setParseError(null)
    }
  }

  const handleTemplateValueChange = (value: string) => {
    setTemplateValue(value)
    if (!value) {
      setSelectedTemplate(null)
      setParsedData(null)
      setSelectedSpec(null)
      setParseError(null)
    }
  }

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col p-0 rounded-none border-none bg-sidebar overflow-hidden gap-0">
        <CardHeader className="py-3! px-4 border-b shrink-0 gap-0 bg-secondary">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CardTitle className="text-sm font-medium shrink-0 flex-1">
                Templates
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebarPosition}
                    className="h-7 w-7 p-0"
                    aria-label="Toggle sidebar position"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle sidebar position</TooltipContent>
              </Tooltip>
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
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-y-auto">
          <TemplatesCombobox
            open={commandOpen}
            onOpenChange={setCommandOpen}
            onTemplateSelect={handleTemplateSelect}
            value={templateValue}
            onValueChange={handleTemplateValueChange}
            placeholder="Search templates..."
            className="w-full"
            filePath={filePath}
          />

          {selectedTemplate === null ? (
            <Empty className="h-full">
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
            <Tabs
              defaultValue="object-tree"
              className="gap-4 mt-4"
            >
              <TabsList className="w-full border">
                <TabsTrigger value="object-tree">Object Tree</TabsTrigger>
                {selectedSpec && (
                  <TabsTrigger value="details">Details</TabsTrigger>
                )}
              </TabsList>
              <TabsContent
                value="object-tree"
                className="mt-4"
              >
                {parseError ? (
                  <Empty className="h-full">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <AlertCircle className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>
                        Could not parse data as &quot;{selectedTemplate.name}
                        &quot; format
                      </EmptyTitle>
                      <EmptyDescription>{parseError}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="-m-4">
                    <ObjectTree
                      parsedData={parsedData}
                      spec={selectedSpec}
                      onNodeSelect={(range) => {
                        if (onScrollToOffset) {
                          onScrollToOffset(range.start)
                        }
                        if (onSelectedOffsetRangeChange) {
                          onSelectedOffsetRangeChange(range)
                        }
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              {selectedSpec && (
                <TabsContent value="details">
                  <div className="space-y-4">
                    {selectedSpec?.meta && (
                      <Card>
                        <CardContent className="text-sm">
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold mb-3">
                              Format Information
                            </h3>
                            <dl className="space-y-4 text-sm">
                              {selectedSpec.meta.title && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    Title
                                  </dt>
                                  <dd className="mt-1">
                                    {selectedSpec.meta.title}
                                  </dd>
                                </div>
                              )}
                              {selectedSpec.meta.endian && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    Endian
                                  </dt>
                                  <dd className="mt-1">
                                    {typeof selectedSpec.meta.endian ===
                                    "string"
                                      ? selectedSpec.meta.endian.toUpperCase()
                                      : "Conditional"}
                                  </dd>
                                </div>
                              )}
                              {selectedSpec.meta["file-extension"] && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    File Extensions
                                  </dt>
                                  <dd className="mt-1">
                                    {Array.isArray(
                                      selectedSpec.meta["file-extension"]
                                    )
                                      ? selectedSpec.meta[
                                          "file-extension"
                                        ].join(", ")
                                      : selectedSpec.meta["file-extension"]}
                                  </dd>
                                </div>
                              )}
                              {selectedSpec.meta.license && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    License
                                  </dt>
                                  <dd className="mt-1">
                                    {selectedSpec.meta.license}
                                  </dd>
                                </div>
                              )}
                              {selectedSpec.meta.encoding && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    Encoding
                                  </dt>
                                  <dd className="mt-1">
                                    {selectedSpec.meta.encoding}
                                  </dd>
                                </div>
                              )}
                              {selectedSpec.meta.application && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    Application
                                  </dt>
                                  <dd className="mt-1">
                                    {Array.isArray(
                                      selectedSpec.meta.application
                                    )
                                      ? selectedSpec.meta.application.join(", ")
                                      : selectedSpec.meta.application}
                                  </dd>
                                </div>
                              )}
                              {selectedSpec.meta.tags &&
                                selectedSpec.meta.tags.length > 0 && (
                                  <div>
                                    <dt className="font-medium text-muted-foreground">
                                      Tags
                                    </dt>
                                    <dd className="mt-1">
                                      {selectedSpec.meta.tags.join(", ")}
                                    </dd>
                                  </div>
                                )}
                              {selectedSpec.meta["ks-version"] && (
                                <div>
                                  <dt className="font-medium text-muted-foreground">
                                    KS Version
                                  </dt>
                                  <dd className="mt-1">
                                    {selectedSpec.meta["ks-version"]}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {selectedSpec?.doc && (
                      <Card>
                        <CardContent className="text-sm">
                          {/* Note: MarkdownRenderer will need to be passed as a prop or imported from web app */}
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-xs">
                              {selectedSpec.doc}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
