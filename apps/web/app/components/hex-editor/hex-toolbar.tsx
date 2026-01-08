import type { FunctionComponent, ReactNode } from "react";

type HexToolbarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

export const HexToolbar: FunctionComponent<HexToolbarProps> = ({
  left,
  center,
  right,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-start min-w-0 flex-1">{left}</div>
      {center && (
        <div className="flex items-center grow justify-center">{center}</div>
      )}
      {right && (
        <div className="flex items-end justify-end flex-1 min-w-0">{right}</div>
      )}
    </div>
  );
};
