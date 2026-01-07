import * as React from 'react';
import type { DiffResult } from '@binspector/types';
import { Card, CardContent, CardHeader, CardTitle } from '@binspector/ui';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface DiffViewerProps {
  diff: DiffResult;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const added = diff.diffs.filter(d => d.type === 'added').length;
  const removed = diff.diffs.filter(d => d.type === 'removed').length;
  const modified = diff.diffs.filter(d => d.type === 'modified').length;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Added</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{added}</div>
          <p className="text-xs text-muted-foreground">bytes added</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Removed</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{removed}</div>
          <p className="text-xs text-muted-foreground">bytes removed</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Modified</CardTitle>
          <RefreshCw className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">{modified}</div>
          <p className="text-xs text-muted-foreground">bytes modified</p>
        </CardContent>
      </Card>
    </div>
  );
}

