"use client";

import { FunctionComponent } from "react";
import { HardDrive, Upload, Link as LinkIcon } from "lucide-react";
import { cn } from "@hexed/ui";

export type FileSourceIconProps = {
  fileSource: "path" | "client" | "url";
  className?: string;
};

export const FileSourceIcon: FunctionComponent<FileSourceIconProps> = ({
  fileSource,
  className,
}) => {
  const iconClassName = cn("h-4 w-4", className);

  switch (fileSource) {
    case "path":
      return <HardDrive className={iconClassName} />;
    case "client":
      return <Upload className={iconClassName} />;
    case "url":
      return <LinkIcon className={iconClassName} />;
    default:
      return <HardDrive className={iconClassName} />;
  }
};
