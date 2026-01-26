"use client"

import { FunctionComponent, ReactNode, useState } from "react"
import {
  BarChart3,
  CaseSensitive,
  FilePlus,
  FolderOpen,
  Home,
  Info,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  Save,
  Sun,
  Trash2
} from "lucide-react"

import {
  FileSourceIcon,
  formatFilenameForDisplay,
  Hotkeys,
  Sidebar,
  useHexedFileContext,
  useHexedSettingsContext,
  useRecentFiles
} from "@hexed/editor"
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

import { Theme } from "../../providers/theme-provider"
import { AboutDialog } from "../dialogs/about-dialog"
import { HexedPlugin } from "../../plugins/types"

export type MenuItem = {
  label: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
}

export type MenuProps = {
  showHistogram: boolean
  onShowHistogramChange: (show: boolean) => void
  onNavigate?: (path: string) => void
  plugins: HexedPlugin[]
}

export const Menu: FunctionComponent<MenuProps> = ({
  // currentSnapshot,
  showHistogram,
  onShowHistogramChange,
  plugins,
}) => {
  const { onChangeInput } = useHexedFileContext()
  const { recentFiles, clearRecentFiles, removeRecentFile } = useRecentFiles()
  const {
    sidebar,
    setSidebar,
    showAscii,
    setShowAscii,
    showChecksums,
    setShowChecksums,
    sidebarPosition,
    setSidebarPosition,
    showMemoryProfiler,
    setShowMemoryProfiler,
    theme,
    setTheme
  } = useHexedSettingsContext()
  const [showClientFileDialog, setShowClientFileDialog] = useState(false)
  const [clickedClientFileHandleId, setClickedClientFileHandleId] = useState<
    string | null
  >(null)
  const [showAboutDialog, setShowAboutDialog] = useState(false)

  return (
    <>
      <DropdownMenuContent align="start">
        {/* Home */}
        <DropdownMenuItem asChild>
          <a
            href={`${window.location.origin + window.location.pathname}`}
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              onChangeInput(null)
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </a>
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
                  const editPath = `/edit/${file.id}`

                  return (
                    <DropdownMenuItem
                      key={file.id}
                      asChild
                    >
                      <a
                        href={editPath}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          onChangeInput(file.id)
                        }}
                      >
                        <FileSourceIcon
                          fileSource={fileSource}
                          fileName={file.handle.name}
                          className="mr-2"
                        />
                        {formatFilenameForDisplay(file.handle.name)}
                      </a>
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
              value={String(sidebar)}
              onValueChange={(v) => setSidebar(sidebar === v ? null : v as Sidebar)}
            >
              {plugins.filter((plugin) => plugin.type === "sidebar").map((plugin) => (
                <DropdownMenuRadioItem
                  key={plugin.id}
                  value={plugin.id}
                  className="cursor-pointer"
                >
                  <plugin.icon className="mr-2 h-4 w-4" />
                  {plugin.title}
                  <DropdownMenuShortcut>
                    {plugin.hotkey?.formatted}
                  </DropdownMenuShortcut>
                </DropdownMenuRadioItem>
              ))}

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
        {setTheme && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Palette className="mr-2 h-4 w-4" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme || "system"}
                onValueChange={(value) => setTheme(value as Theme)}
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
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setShowAboutDialog(true)}
          className="cursor-pointer"
        >
          <Info className="mr-2 h-4 w-4" />
          About
        </DropdownMenuItem>
      </DropdownMenuContent>
      {/* {currentSnapshot?.data && (
        <Dialog
          open={showHistogram}
          onOpenChange={onShowHistogramChange}
        >
          <DialogContent className="max-w-none! w-[90vw] p-0 overflow-hidden">
            <Histogram data={currentSnapshot.data} />
          </DialogContent>
        </Dialog>
      )} */}
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
                if (clickedClientFileHandleId) {
                  removeRecentFile(clickedClientFileHandleId)
                }
                setShowClientFileDialog(false)
                setClickedClientFileHandleId(null)
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
      <AboutDialog
        open={showAboutDialog}
        onOpenChange={setShowAboutDialog}
      />
    </>
  )
}
