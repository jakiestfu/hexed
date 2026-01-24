import { FunctionComponent } from "react"
import { File, FileCode, FileImage, FileType, FileVideo, Film, FolderOpen } from "lucide-react"

import { cn } from "@hexed/ui"

import { FileSource } from "../../types"

export type FileSourceIconProps = {
  fileSource: FileSource
  fileName: string
  className?: string
}

const getIconForExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()
  switch (extension) {
    case 'mp4':
    case 'mov':
      return FileVideo;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'tiff':
    case 'ico':
    case 'webp':
      return FileImage;
    case 'txt':
    case 'md':
      return FileType;
    case 'json':
    case 'yaml':
    case 'html':
    case 'css':
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'php':
    case 'py':
    case 'rb':
    case 'go':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'cs':
    case 'swift':
    case 'kotlin':
    case 'scala':
    case 'rust':
      return FileCode;
    default:
      return File;
  }
}

export const FileSourceIcon: FunctionComponent<FileSourceIconProps> = ({
  fileSource,
  fileName,
  className
}) => {
  const iconClassName = cn("h-4 w-4", className)
  const Icon = getIconForExtension(fileName);
  return <Icon className={iconClassName} />
}
