"use client"

import { FunctionComponent, ReactNode, useState } from "react"
import {
  BarChart3,
  Binary,
  CaseSensitive,
  FilePlus,
  FileText,
  FolderOpen,
  Github,
  Home,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  Save,
  Sun,
  Trash2,
  Type
} from "lucide-react"
import { useTheme } from "next-themes"
import { Link } from "react-router-dom"

import type { BinarySnapshot } from "@hexed/types"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@hexed/ui"

import { useRecentFiles } from "~/hooks/use-recent-files"
import { useSettings } from "~/hooks/use-settings"
import { Hotkeys } from "~/utils/hotkey-format"
import { encodeHandleId } from "~/utils/path-encoding"
import { FileSourceIcon } from "./hex-editor/file-source-icon"
import { Histogram } from "./hex-editor/histogram"
import { formatFilenameForDisplay } from "./hex-editor/utils"

export type MenuItem = {
  label: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
}

export type MenuProps = {
  menuItems?: MenuItem[]
  githubUrl?: string
  currentSnapshot?: BinarySnapshot | null
  showHistogram: boolean
  onShowHistogramChange: (show: boolean) => void
}

const isInternalLink = (href: string): boolean => {
  return href.startsWith("/")
}

export const Menu: FunctionComponent<MenuProps> = ({
  menuItems,
  githubUrl = "https://github.com/jakiestfu/hexed",
  currentSnapshot,
  showHistogram,
  onShowHistogramChange
}) => {
  const { theme, setTheme } = useTheme()
  const { recentFiles, clearRecentFiles, removeRecentFile } = useRecentFiles()
  const {
    showAscii,
    setShowAscii,
    showChecksums,
    setShowChecksums,
    showInterpreter,
    setShowInterpreter,
    showTemplates,
    setShowTemplates,
    showStrings,
    setShowStrings,
    sidebarPosition,
    setSidebarPosition,
    showMemoryProfiler,
    setShowMemoryProfiler,
    showWorkerStatus,
    setShowWorkerStatus
  } = useSettings()
  const [showClientFileDialog, setShowClientFileDialog] = useState(false)
  const [clickedClientFilePath, setClickedClientFilePath] = useState<
    string | null
  >(null)

  // Determine active sidebar panel
  const activeSidebarPanel = showInterpreter
    ? "interpreter"
    : showTemplates
      ? "templates"
      : showStrings
        ? "strings"
        : null

  const handleSidebarPanelChange = (value: string) => {
    setShowInterpreter(false)
    setShowTemplates(false)
    setShowStrings(false)

    switch (value) {
      case "interpreter":
        setShowInterpreter(true)
        break
      case "templates":
        setShowTemplates(true)
        break
      case "strings":
        setShowStrings(true)
        break
      default:
        break
    }
  }

  return (
    <>
      <DropdownMenuContent align="start">
        {/* Home */}
        <DropdownMenuItem asChild>
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* File menu items */}
        <DropdownMenuItem
          disabled
          className="cursor-pointer"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          New
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="cursor-pointer"
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Open
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <FolderOpen className="mr-2 h-4 w-4" />
            Open Recent
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {recentFiles.length > 0 ? (
              <>
                {recentFiles.map((file) => {
                  // Use stored source, fallback to "file-system" for backward compatibility
                  const fileSource = file.source || "file-system"

                  if (file.handleId) {
                    // For file-system files with handleId, navigate to /edit/<handleId>
                    const encodedHandleId = encodeHandleId(file.handleId)
                    return (
                      <DropdownMenuItem
                        key={file.path}
                        asChild
                      >
                        <Link
                          to={`/edit/${encodedHandleId}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <FileSourceIcon
                            fileSource={fileSource}
                            className="mr-2"
                          />
                          {formatFilenameForDisplay(file.path)}
                        </Link>
                      </DropdownMenuItem>
                    )
                  }

                  // For files without handleId, show dialog on click
                  return (
                    <DropdownMenuItem
                      key={file.path}
                      onClick={() => {
                        setClickedClientFilePath(file.path)
                        setShowClientFileDialog(true)
                      }}
                      className="cursor-pointer"
                    >
                      <FileSourceIcon
                        fileSource={fileSource}
                        className="mr-2"
                      />
                      <span className="text-muted-foreground">
                        {formatFilenameForDisplay(file.path)}
                      </span>
                    </DropdownMenuItem>
                  )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearRecentFiles}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Recent
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                disabled
                className="text-muted-foreground"
              >
                No recent files
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled
          className="cursor-pointer"
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="cursor-pointer"
        >
          <Save className="mr-2 h-4 w-4" />
          Save As...
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <CaseSensitive className="mr-2 h-4 w-4" />
            Hex Editor
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              checked={showAscii}
              onCheckedChange={setShowAscii}
              className="cursor-pointer"
            >
              Show ASCII
              <DropdownMenuShortcut>
                {Hotkeys.toggleAscii()}
              </DropdownMenuShortcut>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showChecksums}
              onCheckedChange={setShowChecksums}
              className="cursor-pointer"
            >
              Show Checksums
              <DropdownMenuShortcut>
                {Hotkeys.toggleChecksums()}
              </DropdownMenuShortcut>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showMemoryProfiler}
              onCheckedChange={setShowMemoryProfiler}
              className="cursor-pointer"
            >
              Show Memory Profiler
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showWorkerStatus}
              onCheckedChange={setShowWorkerStatus}
              className="cursor-pointer"
            >
              Show Worker Status
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <CaseSensitive className="mr-2 h-4 w-4" />
            Visualize
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => onShowHistogramChange(true)}
              disabled={!currentSnapshot?.data}
              className="cursor-pointer"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Show Histogram
              <DropdownMenuShortcut>
                {Hotkeys.toggleHistogram()}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <PanelLeft className="mr-2 h-4 w-4" />
            Sidebar
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={activeSidebarPanel || ""}
              onValueChange={handleSidebarPanelChange}
            >
              <DropdownMenuRadioItem
                value="interpreter"
                className="cursor-pointer"
              >
                <span className="flex items-center">
                  <Binary className="mr-2 h-4 w-4" />
                  Interpreter
                </span>
                <DropdownMenuShortcut>
                  {Hotkeys.toggleInterpreter()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="templates"
                className="cursor-pointer"
              >
                <span className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Templates
                </span>
                <DropdownMenuShortcut>
                  {Hotkeys.toggleTemplates()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="strings"
                className="cursor-pointer"
              >
                <span className="flex items-center">
                  <Type className="mr-2 h-4 w-4" />
                  Strings
                </span>
                <DropdownMenuShortcut>
                  {Hotkeys.toggleStrings()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sidebarPosition}
              onValueChange={(value) =>
                setSidebarPosition(value as "left" | "right")
              }
            >
              <DropdownMenuRadioItem
                value="left"
                className="cursor-pointer"
              >
                Position: Left
                <DropdownMenuShortcut>
                  {Hotkeys.toggleSidebarPosition()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="right"
                className="cursor-pointer"
              >
                Position: Right
                <DropdownMenuShortcut>
                  {Hotkeys.toggleSidebarPosition()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme || "system"}
              onValueChange={(value) => setTheme(value)}
            >
              <DropdownMenuRadioItem
                value="light"
                className="cursor-pointer"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="dark"
                className="cursor-pointer"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="system"
                className="cursor-pointer"
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {githubUrl && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      {currentSnapshot?.data && (
        <Dialog
          open={showHistogram}
          onOpenChange={onShowHistogramChange}
        >
          <DialogContent className="max-w-none! w-[90vw] p-0 overflow-hidden">
            <Histogram data={currentSnapshot.data} />
          </DialogContent>
        </Dialog>
      )}
      <Dialog
        open={showClientFileDialog}
        onOpenChange={setShowClientFileDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Could not restore file</DialogTitle>
            <DialogDescription>
              This file was opened using the File System Access API, but the
              file handle could not be restored. This may happen if the file was
              moved or deleted, or if permissions were revoked. Please select
              the file again to open it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (clickedClientFilePath) {
                  removeRecentFile(clickedClientFilePath)
                }
                setShowClientFileDialog(false)
                setClickedClientFilePath(null)
              }}
            >
              Remove from recent files
            </Button>
            <Button onClick={() => setShowClientFileDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
