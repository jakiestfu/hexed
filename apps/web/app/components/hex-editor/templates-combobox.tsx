"use client";

import { useMemo, useState } from "react";
import type { FunctionComponent } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@hexed/ui/components/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@hexed/ui/components/popover";
import { Button } from "@hexed/ui/components/button";
import { cn } from "@hexed/ui/lib/utils";
import { manifest, type ManifestEntry } from "@hexed/binary-templates";

type TemplateEntry = {
  name: string;
  title: string;
  path: string;
};

type TemplatesComboboxProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTemplateSelect: (entry: TemplateEntry) => void;
  placeholder?: string;
  className?: string;
};

// Helper function to capitalize category names
function capitalizeCategory(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to extract templates from manifest
function extractTemplates(entries: ManifestEntry[]): Array<{
  category: string;
  templates: TemplateEntry[];
}> {
  const result: Array<{ category: string; templates: TemplateEntry[] }> = [];

  for (const entry of entries) {
    if ("children" in entry) {
      // This is a category
      const templates: TemplateEntry[] = [];

      function collectTemplates(children: ManifestEntry[]) {
        for (const child of children) {
          if ("title" in child && "path" in child) {
            // This is a template
            templates.push({
              name: child.name,
              title: child.title,
              path: child.path,
            });
          } else if ("children" in child) {
            // Nested category, recurse
            collectTemplates(child.children);
          }
        }
      }

      collectTemplates(entry.children);

      if (templates.length > 0) {
        result.push({
          category: entry.name,
          templates,
        });
      }
    }
  }

  return result;
}

export const TemplatesCombobox: FunctionComponent<TemplatesComboboxProps> = ({
  open,
  onOpenChange,
  onTemplateSelect,
  placeholder = "Select template...",
  className,
}) => {
  const [value, setValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // Process manifest to extract categories and templates
  const categoriesWithTemplates = useMemo(() => extractTemplates(manifest), []);

  // Flatten all templates to find the selected one
  const allTemplates = useMemo(() => {
    const templates: TemplateEntry[] = [];
    categoriesWithTemplates.forEach(({ templates: categoryTemplates }) => {
      templates.push(...categoryTemplates);
    });
    return templates;
  }, [categoriesWithTemplates]);

  const selectedTemplate = allTemplates.find(
    (template) => template.name === value
  );

  const handleSelect = (template: TemplateEntry) => {
    const newValue = value === template.name ? "" : template.name;
    setValue(newValue);
    setSearchValue("");
    onOpenChange?.(false);
    
    if (newValue) {
      onTemplateSelect(template);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchValue("");
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedTemplate ? selectedTemplate.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder="Search templates..."
          />
          <CommandList>
            <CommandEmpty>No templates found.</CommandEmpty>
            {categoriesWithTemplates.map(({ category, templates }, index) => (
              <div key={category}>
                <CommandGroup heading={capitalizeCategory(category)}>
                  {templates.map((template) => (
                    <CommandItem
                      key={template.name}
                      value={`${template.name} ${template.title}`}
                      onSelect={() => handleSelect(template)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === template.name ? "opacity-100" : "opacity-0"
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
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
