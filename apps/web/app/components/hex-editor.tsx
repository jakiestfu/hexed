import * as React from 'react';
import type { BinarySnapshot, DiffViewMode } from '@binspector/types';
import { formatDataIntoRows, computeDiff, getDiffAtOffset } from '@binspector/binary-utils';
import { Card, CardContent, Toggle, cn } from '@binspector/ui';
import { Columns2, Minus, Eye } from 'lucide-react';
import { DiffViewer } from './diff-viewer';

interface HexEditorProps {
  snapshot: BinarySnapshot;
  previousSnapshot?: BinarySnapshot;
}

export function HexEditor({ snapshot, previousSnapshot }: HexEditorProps) {
  const [diffMode, setDiffMode] = React.useState<DiffViewMode>('none');
  const [showAscii, setShowAscii] = React.useState(true);
  const bytesPerRow = 16;

  // Compute diff if we have a previous snapshot and diff mode is active
  const diff = React.useMemo(() => {
    if (!previousSnapshot || diffMode === 'none') return null;
    return computeDiff(previousSnapshot, snapshot);
  }, [previousSnapshot, snapshot, diffMode]);

  const rows = React.useMemo(() => {
    return formatDataIntoRows(snapshot.data, bytesPerRow);
  }, [snapshot.data, bytesPerRow]);

  const previousRows = React.useMemo(() => {
    if (!previousSnapshot) return null;
    return formatDataIntoRows(previousSnapshot.data, bytesPerRow);
  }, [previousSnapshot, bytesPerRow]);

  const getDiffColorClass = (offset: number) => {
    if (!diff) return '';
    const byteDiff = getDiffAtOffset(diff, offset);
    if (!byteDiff) return '';

    switch (byteDiff.type) {
      case 'added':
        return 'bg-green-500/20 text-green-900 dark:text-green-100 font-semibold';
      case 'removed':
        return 'bg-red-500/20 text-red-900 dark:text-red-100 font-semibold';
      case 'modified':
        return 'bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 font-semibold';
      default:
        return '';
    }
  };

  const toggleDiffMode = () => {
    if (!previousSnapshot) return;
    
    setDiffMode((current) => {
      if (current === 'none') return 'inline';
      if (current === 'inline') return 'side-by-side';
      return 'none';
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {diff && diffMode !== 'none' && <DiffViewer diff={diff} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Size: {snapshot.data.length.toLocaleString()} bytes
          </span>
          <Toggle
            pressed={showAscii}
            onPressedChange={setShowAscii}
            aria-label="Toggle ASCII view"
            size="sm"
          >
            <Eye className="h-3 w-3" />
            <span className="ml-1 text-xs">ASCII</span>
          </Toggle>
        </div>
        {previousSnapshot && (
          <div className="flex items-center gap-2">
            <Toggle
              pressed={diffMode !== 'none'}
              onPressedChange={toggleDiffMode}
              aria-label="Toggle diff mode"
            >
              {diffMode === 'side-by-side' ? (
                <Columns2 className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span className="ml-2">
                {diffMode === 'none' ? 'Show Diff' : diffMode === 'inline' ? 'Inline' : 'Side-by-Side'}
              </span>
            </Toggle>
          </div>
        )}
      </div>

      {/* Hex Editor View */}
      {diffMode === 'side-by-side' && previousRows ? (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2 text-muted-foreground">Previous</div>
              <HexView rows={previousRows} showAscii={showAscii} diff={null} getDiffColorClass={() => ''} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Current</div>
              <HexView rows={rows} showAscii={showAscii} diff={diff} getDiffColorClass={getDiffColorClass} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <HexView rows={rows} showAscii={showAscii} diff={diff} getDiffColorClass={getDiffColorClass} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface HexViewProps {
  rows: ReturnType<typeof formatDataIntoRows>;
  showAscii: boolean;
  diff: ReturnType<typeof computeDiff> | null;
  getDiffColorClass: (offset: number) => string;
}

function HexView({ rows, showAscii, diff, getDiffColorClass }: HexViewProps) {
  return (
    <div className="overflow-auto max-h-[600px] font-mono text-sm">
      {rows.map((row) => (
        <div key={row.startOffset} className="flex gap-4 hover:bg-muted/50 py-0.5">
          {/* Address */}
          <div className="text-muted-foreground select-none shrink-0 w-24">
            {row.address}
          </div>

          {/* Hex bytes */}
          <div className="flex gap-1 flex-wrap">
            {row.hexBytes.map((byte, index) => {
              const offset = row.startOffset + index;
              const colorClass = getDiffColorClass(offset);
              return (
                <span
                  key={offset}
                  className={cn(
                    'inline-block w-6 text-center rounded px-0.5',
                    colorClass
                  )}
                  title={`Offset: ${offset} (0x${offset.toString(16).toUpperCase()})`}
                >
                  {byte}
                </span>
              );
            })}
            {/* Padding for incomplete rows */}
            {row.hexBytes.length < 16 &&
              Array.from({ length: 16 - row.hexBytes.length }).map((_, i) => (
                <span key={`pad-${i}`} className="inline-block w-6" />
              ))}
          </div>

          {/* ASCII */}
          {showAscii && (
            <div className="border-l pl-4 text-muted-foreground">
              {row.ascii.split('').map((char, index) => {
                const offset = row.startOffset + index;
                const colorClass = getDiffColorClass(offset);
                return (
                  <span
                    key={offset}
                    className={cn('inline-block rounded px-0.5', colorClass)}
                    title={`Offset: ${offset}`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
