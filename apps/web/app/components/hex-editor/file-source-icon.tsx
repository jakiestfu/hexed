"use client";

import { FunctionComponent } from "react";
import {
  HardDrive,
  Upload,
  Link as LinkIcon,
  FileQuestion,
} from "lucide-react";
import { cn } from "@hexed/ui";
import { FileSource } from "~/components/hex-editor/types";

export type FileSourceIconProps = {
  fileSource: FileSource;
  className?: string;
};

export const FileSourceIcon: FunctionComponent<FileSourceIconProps> = ({
  fileSource,
  className,
}) => {
  const iconClassName = cn("h-4 w-4", className);

  switch (fileSource) {
    case "disk":
      return <HardDrive className={iconClassName} />;
    case "upload":
      return <Upload className={iconClassName} />;
    case "url":
      return <LinkIcon className={iconClassName} />;
    default:
      return <FileQuestion className={iconClassName} />;
  }
};
