import type { FunctionComponent, ReactNode } from "react";

type HexFooterProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

export const HexFooter: FunctionComponent<HexFooterProps> = ({
  left,
  center,
  right,
}) => {
  return (
    <div className="flex items-center justify-between w-full border-t bg-muted/30 p-4">
      <div className="flex items-start min-w-0 flex-1">{left}</div>
      {center ? (
        <div className="flex items-center grow justify-center">{center}</div>
      ) : (
        <span />
      )}
      {right ? (
        <div className="flex items-end justify-end flex-1 min-w-0">{right}</div>
      ) : (
        <span />
      )}
    </div>
  );
};
