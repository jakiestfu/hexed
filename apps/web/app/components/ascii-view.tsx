import * as React from 'react';
import { byteToAscii } from '@binspector/binary-utils';
import { cn } from '@binspector/ui';

interface AsciiViewProps {
  data: Uint8Array;
  startOffset: number;
  getDiffColorClass?: (offset: number) => string;
}

export function AsciiView({ data, startOffset, getDiffColorClass }: AsciiViewProps) {
  return (
    <div className="font-mono text-sm text-muted-foreground">
      {Array.from(data).map((byte, index) => {
        const offset = startOffset + index;
        const char = byteToAscii(byte);
        const colorClass = getDiffColorClass ? getDiffColorClass(offset) : '';
        
        return (
          <span
            key={offset}
            className={cn('inline-block', colorClass)}
            title={`Offset: ${offset}, Byte: 0x${byte.toString(16).padStart(2, '0')}`}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

