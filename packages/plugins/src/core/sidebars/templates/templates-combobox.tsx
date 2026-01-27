import { useState } from "react"
import type { FunctionComponent } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { manifest } from "@hexed/templates"
import { Button } from "@hexed/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@hexed/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@hexed/ui/components/popover"
import { cn } from "@hexed/ui/lib/utils"

type TemplateEntry = {
  name: string
  title: string
  path: string
  extension?: string | string[]
}

type TemplatesComboboxProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onTemplateSelect: (entry: TemplateEntry) => void
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  filePath?: string
}

// Helper function to capitalize category names
function capitalizeCategory(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Type guard to check if an entry is a template (has title and path)
function isTemplate(entry: unknown): entry is {
  name: string
  title: string
  path: string
  extension?: string | string[]
} {
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

// Helper function to recursively collect all templates from children
function collectTemplatesFromChildren(children: unknown[]): TemplateEntry[] {
  const templates: TemplateEntry[] = []
  for (const child of children) {
    if (isTemplate(child)) {
      templates.push({
        name: child.name,
        title: child.title,
        path: child.path,
        extension: child.extension
      })
    } else if (isCategory(child)) {
      templates.push(...collectTemplatesFromChildren(child.children))
    }
  }
  return templates
}

// Helper function to extract file extension from file path
function getFileExtension(filePath: string | undefined): string | null {
  if (!filePath) return null
  const parts = filePath.split(".")
  if (parts.length < 2) return null
  const extension = parts[parts.length - 1]?.toLowerCase()
  return extension || null
}

// Helper function to check if a template matches a file extension
function templateMatchesExtension(
  template: TemplateEntry,
  extension: string
): boolean {
  if (!template.extension) return false
  if (typeof template.extension === "string") {
    return template.extension.toLowerCase() === extension
  }
  if (Array.isArray(template.extension)) {
    return template.extension.some((ext) => ext.toLowerCase() === extension)
  }
  return false
}

// Helper function to find recommended templates based on file extension
function findRecommendedTemplates(
  entries: unknown[],
  extension: string | null
): TemplateEntry[] {
  if (!extension) return []
  const recommended: TemplateEntry[] = []
  for (const entry of entries) {
    if (isTemplate(entry)) {
      if (templateMatchesExtension(entry, extension)) {
        recommended.push({
          name: entry.name,
          title: entry.title,
          path: entry.path,
          extension: entry.extension
        })
      }
    } else if (isCategory(entry)) {
      recommended.push(...findRecommendedTemplates(entry.children, extension))
    }
  }
  return recommended
}

export const TemplatesCombobox: FunctionComponent<TemplatesComboboxProps> = ({
  open,
  onOpenChange,
  onTemplateSelect,
  value = "",
  onValueChange,
  placeholder = "Select template...",
  className,
  filePath
}) => {
  const [searchValue, setSearchValue] = useState("")

  const selectedTemplate = value
    ? (() => {
        // Find template by name in manifest
        for (const entry of manifest) {
          if (isTemplate(entry) && entry.name === value) {
            return {
              name: entry.name,
              title: entry.title,
              path: entry.path,
              extension: entry.extension
            }
          }
          if (isCategory(entry)) {
            const found = findTemplateInCategory(entry.children, value)
            if (found) {
              return found
            }
          }
        }
        return undefined
      })()
    : undefined

  // Helper function to recursively find a template by name
  function findTemplateInCategory(
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
        const found = findTemplateInCategory(entry.children, name)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }
  const fileExtension = getFileExtension(filePath)
  const recommendedTemplates = findRecommendedTemplates(manifest, fileExtension)

  const handleSelect = (template: TemplateEntry) => {
    const newValue = value === template.name ? "" : template.name
    onValueChange?.(newValue)
    setSearchValue("")
    onOpenChange?.(false)

    if (newValue) {
      onTemplateSelect(template)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchValue("")
    }
    onOpenChange?.(newOpen)
  }

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedTemplate ? selectedTemplate.title : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={true}>
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder="Search templates..."
          />
          <CommandList>
            <CommandEmpty>No templates found.</CommandEmpty>
            {(() => {
              // Get recommended templates
              const recommendedTemplateNames = new Set(
                recommendedTemplates.map((t) => t.name)
              )

              // Filter out recommended templates from category groups
              const categories = manifest.filter(isCategory)
              const categoriesWithTemplates = categories
                .map((category) => ({
                  category,
                  templates: collectTemplatesFromChildren(
                    category.children
                  ).filter(
                    (template) => !recommendedTemplateNames.has(template.name)
                  )
                }))
                .filter(({ templates }) => templates.length > 0)

              const hasRecommended = recommendedTemplates.length > 0
              const hasCategories = categoriesWithTemplates.length > 0

              return (
                <>
                  {hasRecommended && (
                    <>
                      <CommandGroup heading="Recommended">
                        {recommendedTemplates.map((template) => (
                          <CommandItem
                            key={template.name}
                            value={`${template.name} ${template.title}`}
                            onSelect={() => handleSelect(template)}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                value === template.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {template.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {hasCategories && <CommandSeparator />}
                    </>
                  )}
                  {categoriesWithTemplates.map(
                    ({ category, templates }, index) => (
                      <div key={category.name}>
                        <CommandGroup
                          heading={capitalizeCategory(category.name)}
                        >
                          {templates.map((template) => (
                            <CommandItem
                              key={template.name}
                              value={`${template.name} ${template.title}`}
                              onSelect={() => handleSelect(template)}
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  value === template.name
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {template.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {index < categoriesWithTemplates.length - 1 && (
                          <CommandSeparator />
                        )}
                      </div>
                    )
                  )}
                </>
              )
            })()}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
