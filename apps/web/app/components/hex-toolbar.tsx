import * as React from "react";

interface HexToolbarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export function HexToolbar({ left, center, right }: HexToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-start min-w-0 w-[100px]">{left}</div>
      {center && (
        <div className="flex items-center grow justify-center">{center}</div>
      )}
      {right && (
        <div className="flex items-end justify-end w-[100px] min-w-0">
          {right}
        </div>
      )}
    </div>
  );
}
