"use client"

import { FunctionComponent } from "react"
import { FolderOpen } from "lucide-react"

import { cn } from "@hexed/ui"

import { FileSource } from "./types"

export type FileSourceIconProps = {
  fileSource: FileSource
  className?: string
}

export const FileSourceIcon: FunctionComponent<FileSourceIconProps> = ({
  className
}) => {
  const iconClassName = cn("h-4 w-4", className)
  return <FolderOpen className={iconClassName} />
}
