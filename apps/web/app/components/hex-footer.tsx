import * as React from "react";

interface HexFooterProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export function HexFooter({ left, center, right }: HexFooterProps) {
  return (
    <div className="flex items-center justify-between w-full border-t bg-muted/30 p-4">
      <div className="flex items-start min-w-0 w-[100px]">{left}</div>
      {center ? (
        <div className="flex items-center grow justify-center">{center}</div>
      ) : (
        <span />
      )}
      {right ? (
        <div className="flex items-end justify-end w-[100px] min-w-0">
          {right}
        </div>
      ) : (
        <span />
      )}
    </div>
  );
}
