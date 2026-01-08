import type { DiffResult } from "@hexed/types";
import type { FormattedRow } from "@hexed/binary-utils/formatter";
import { hasDiffAtOffset } from "@hexed/binary-utils/differ";
import type { CollapsibleSection, VirtualItemType } from "./types";

/**
 * Check if a row has any changes in the diff
 */
export function hasRowChanges(row: FormattedRow, diff: DiffResult): boolean {
  for (let offset = row.startOffset; offset <= row.endOffset; offset++) {
    if (hasDiffAtOffset(diff, offset)) {
      return true;
    }
  }
  return false;
}

/**
 * Compute collapsible sections for empty rows
 * Maintains a 3-row buffer above and below changed rows
 */
export function computeCollapsibleSections(
  rows: FormattedRow[],
  diff: DiffResult | null,
  bytesPerRow: number
): CollapsibleSection[] {
  if (!diff) return [];

  const sections: CollapsibleSection[] = [];
  const bufferRows = 3;
  const minCollapsibleRows = 4; // Need at least 4 empty rows to collapse

  // Mark which rows have changes
  const rowsWithChanges = new Set<number>();
  for (let i = 0; i < rows.length; i++) {
    if (hasRowChanges(rows[i], diff)) {
      rowsWithChanges.add(i);
    }
  }

  // Mark rows that should be visible (changed rows + buffer)
  const visibleRows = new Set<number>();
  for (const changedRowIndex of rowsWithChanges) {
    // Add buffer rows above
    for (
      let i = Math.max(0, changedRowIndex - bufferRows);
      i < changedRowIndex;
      i++
    ) {
      visibleRows.add(i);
    }
    // Add the changed row itself
    visibleRows.add(changedRowIndex);
    // Add buffer rows below
    for (
      let i = changedRowIndex + 1;
      i <= Math.min(rows.length - 1, changedRowIndex + bufferRows);
      i++
    ) {
      visibleRows.add(i);
    }
  }

  // Find consecutive empty rows that should be collapsed
  let startEmptyRow: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    const isEmpty = !rowsWithChanges.has(i);
    const shouldBeVisible = visibleRows.has(i);

    if (isEmpty && !shouldBeVisible) {
      if (startEmptyRow === null) {
        startEmptyRow = i;
      }
    } else {
      if (startEmptyRow !== null) {
        const emptyRowCount = i - startEmptyRow;
        if (emptyRowCount >= minCollapsibleRows) {
          sections.push({
            startRowIndex: startEmptyRow,
            endRowIndex: i - 1,
            id: `collapse-${startEmptyRow}-${i - 1}`,
            hiddenRowCount: emptyRowCount,
          });
        }
        startEmptyRow = null;
      }
    }
  }

  // Handle trailing empty rows
  if (startEmptyRow !== null) {
    const emptyRowCount = rows.length - startEmptyRow;
    if (emptyRowCount >= minCollapsibleRows) {
      sections.push({
        startRowIndex: startEmptyRow,
        endRowIndex: rows.length - 1,
        id: `collapse-${startEmptyRow}-${rows.length - 1}`,
        hiddenRowCount: emptyRowCount,
      });
    }
  }

  return sections;
}

/**
 * Build virtual items list including rows and collapse buttons
 */
export function buildVirtualItems(
  rows: FormattedRow[],
  collapsibleSections: CollapsibleSection[],
  expandedSections: Set<string>
): VirtualItemType[] {
  const items: VirtualItemType[] = [];
  const sectionMap = new Map<string, CollapsibleSection>();

  for (const section of collapsibleSections) {
    sectionMap.set(section.id, section);
  }

  let i = 0;
  while (i < rows.length) {
    // Check if we're at the start of a collapsible section
    let foundSection: CollapsibleSection | null = null;
    for (const section of collapsibleSections) {
      if (section.startRowIndex === i) {
        foundSection = section;
        break;
      }
    }

    if (foundSection && !expandedSections.has(foundSection.id)) {
      // Add collapse button
      items.push({ type: "collapse", section: foundSection });
      // Skip to end of section
      i = foundSection.endRowIndex + 1;
    } else {
      // Add regular row
      items.push({ type: "row", rowIndex: i });
      i++;
    }
  }

  return items;
}

/**
 * Get the basename from a file path
 */
export function getBasename(filePath: string): string {
  return filePath.split("/").pop() || filePath.split("\\").pop() || filePath;
}

