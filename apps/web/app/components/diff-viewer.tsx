import * as React from "react";
import type { DiffResult } from "@hexed/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hexed/ui";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface DiffViewerProps {
  diff: DiffResult;
  onScrollToOffset: (offset: number) => void;
}

function formatOffset(offset: number): string {
  return `0x${offset.toString(16).toUpperCase().padStart(8, "0")}`;
}

export function DiffViewer({ diff, onScrollToOffset }: DiffViewerProps) {
  const added = diff.diffs.filter((d) => d.type === "added");
  const removed = diff.diffs.filter((d) => d.type === "removed");
  const modified = diff.diffs.filter((d) => d.type === "modified");

  const addedOffsets = added.map((d) => d.offset).sort((a, b) => a - b);
  const removedOffsets = removed.map((d) => d.offset).sort((a, b) => a - b);
  const modifiedOffsets = modified.map((d) => d.offset).sort((a, b) => a - b);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Added</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {added.length}
          </div>
          <p className="text-xs text-muted-foreground mb-2">bytes added</p>
          {addedOffsets.length > 0 && (
            <Select
              onValueChange={(value) => {
                onScrollToOffset(parseInt(value, 16));
              }}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Jump to offset..." />
              </SelectTrigger>
              <SelectContent>
                {addedOffsets.map((offset) => (
                  <SelectItem key={offset} value={offset.toString(16)}>
                    {formatOffset(offset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Removed</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {removed.length}
          </div>
          <p className="text-xs text-muted-foreground mb-2">bytes removed</p>
          {removedOffsets.length > 0 && (
            <Select
              onValueChange={(value) => {
                onScrollToOffset(parseInt(value, 16));
              }}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Jump to offset..." />
              </SelectTrigger>
              <SelectContent>
                {removedOffsets.map((offset) => (
                  <SelectItem key={offset} value={offset.toString(16)}>
                    {formatOffset(offset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Modified</CardTitle>
          <RefreshCw className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">
            {modified.length}
          </div>
          <p className="text-xs text-muted-foreground mb-2">bytes modified</p>
          {modifiedOffsets.length > 0 && (
            <Select
              onValueChange={(value) => {
                onScrollToOffset(parseInt(value, 16));
              }}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Jump to offset..." />
              </SelectTrigger>
              <SelectContent>
                {modifiedOffsets.map((offset) => (
                  <SelectItem key={offset} value={offset.toString(16)}>
                    {formatOffset(offset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
