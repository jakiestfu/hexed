import { useEffect, useRef, useState } from "react"
import type { FormEvent, FunctionComponent } from "react"
import { useRouter } from "next/navigation"
import { Clock, FolderOpen, Link as LinkIcon, Loader2 } from "lucide-react"

import type { BinarySnapshot } from "@hexed/types"
import {
  Button,
  Card,
  CardContent,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@hexed/ui"

import { useQueryParamState } from "~/hooks/use-query-param-state"
import type { RecentFile } from "~/hooks/use-recent-files"
import { isElectron, openFileDialog } from "~/utils/electron"
import { encodeFilePath, isUrlPath } from "~/utils/path-encoding"
import { FileSourceIcon } from "./file-source-icon"
import { FileSource } from "./types"
import { createSnapshotFromFile, formatTimestamp, getBasename } from "./utils"

type DataPickerProps = {
  onFileSelect: (filePath: string | BinarySnapshot) => void
  recentFiles: RecentFile[]
}

// Recent Files Component
const RecentFilesDropdown: FunctionComponent<{
  recentFiles: RecentFile[]
  onSelect: (path: string) => void
}> = ({ recentFiles, onSelect }) => {
  if (recentFiles.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-2"
        align="end"
      >
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Recent Files
          </div>
          {recentFiles.map((file) => (
            <Button
              key={file.path}
              type="button"
              variant="ghost"
              className="w-full justify-start text-left h-auto py-2 px-2"
              onClick={() => onSelect(file.path)}
            >
              <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                <span className="font-mono text-sm truncate w-full">
                  {getBasename(file.path)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(file.timestamp)}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const DataPicker: FunctionComponent<DataPickerProps> = ({
  onFileSelect,
  recentFiles
}) => {
  const router = useRouter()
  const [isInElectron, setIsInElectron] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTabState] = useQueryParamState<FileSource>(
    "tab",
    "upload"
  )
  const setActiveTab = (value: string) => {
    setActiveTabState(value as FileSource)
  }
  const [url, setUrl] = useState("")
  const [pathInput, setPathInput] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDevelopment = process.env.NODE_ENV === "development"

  useEffect(() => {
    setIsInElectron(isElectron())
    // Wait for component mount and local storage restoration
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleRecentFileSelect = (path: string) => {
    // Find the recent file to get its source
    const recentFile = recentFiles.find((file) => file.path === path)
    const source = recentFile?.source || (isUrlPath(path) ? "url" : "disk")

    // If it's a URL, navigate directly to the edit page
    if (source === "url") {
      const encodedUrl = encodeFilePath(path)
      router.push(`/edit/${encodedUrl}`)
    } else {
      // For disk files, use the onFileSelect callback
      onFileSelect(path)
    }
  }

  // File Tab Handlers
  const handleNativeFilePicker = async () => {
    if (!isInElectron) return

    setIsLoading(true)
    try {
      const selectedPath = await openFileDialog()
      if (selectedPath) {
        onFileSelect(selectedPath)
      }
    } catch (error) {
      console.error("Error opening file dialog:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const snapshot = await createSnapshotFromFile(file)
      onFileSelect(snapshot)
    } catch (error) {
      console.error("Error reading file:", error)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // URL Tab Handlers
  const handleUrlSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!url.trim()) return

    setIsLoading(true)
    try {
      const urlToEncode = url.trim()
      const encodedUrl = encodeFilePath(urlToEncode)
      router.push(`/edit/${encodedUrl}`)
    } catch (error) {
      console.error("Error encoding URL:", error)
      alert("Failed to encode URL")
    } finally {
      setIsLoading(false)
    }
  }

  // Path Tab Handlers
  const handlePathSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (pathInput.trim()) {
      onFileSelect(pathInput.trim())
    }
  }

  return (
    <Card
      className={`w-full max-w-lg border-none h-[250px] transition-opacity duration-300 ${
        isMounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <CardContent className="space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: isDevelopment
                ? "repeat(3, 1fr)"
                : "repeat(2, 1fr)"
            }}
          >
            <TabsTrigger value="upload">
              <FileSourceIcon
                fileSource="upload"
                className="mr-2"
              />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <FileSourceIcon
                fileSource="url"
                className="mr-2"
              />
              URL
            </TabsTrigger>
            {isDevelopment && (
              <TabsTrigger value="disk">
                <FileSourceIcon
                  fileSource="disk"
                  className="mr-2"
                />
                Disk
              </TabsTrigger>
            )}
          </TabsList>

          {/* Upload Tab */}
          <TabsContent
            value="upload"
            className="space-y-2 mt-4"
          >
            {isInElectron ? (
              <>
                <label className="text-sm font-medium">Select a file</label>
                <div className="flex gap-2">
                  <Button
                    onClick={handleNativeFilePicker}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FolderOpen className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? "Opening..." : "Choose File"}
                  </Button>
                  <RecentFilesDropdown
                    recentFiles={recentFiles}
                    onSelect={handleRecentFileSelect}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the native file picker to select a binary file
                  {recentFiles.length > 0 && " or select from recent files"}
                </p>
              </>
            ) : (
              <>
                <label
                  htmlFor="file-input"
                  className="text-sm font-medium"
                >
                  Select a file
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      id="file-input"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      disabled={isLoading}
                      className="flex-1 h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    />
                    <RecentFilesDropdown
                      recentFiles={recentFiles}
                      onSelect={handleRecentFileSelect}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose a file or drag and drop it anywhere on the screen
                  {recentFiles.length > 0 && " or select from recent files"}
                </p>
              </>
            )}
          </TabsContent>

          {/* URL Tab */}
          <TabsContent
            value="url"
            className="space-y-2 mt-4"
          >
            <form
              onSubmit={handleUrlSubmit}
              className="space-y-2"
            >
              <label
                htmlFor="url-input"
                className="text-sm font-medium"
              >
                Enter URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <Input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/file.bin"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <RecentFilesDropdown
                    recentFiles={recentFiles}
                    onSelect={handleRecentFileSelect}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4 mr-2" />
                  )}
                  Fetch
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a URL to fetch binary data from a remote resource
                {recentFiles.length > 0 && " or select from recent files"}
              </p>
            </form>
          </TabsContent>

          {/* Disk Tab (Development Only) */}
          {isDevelopment && (
            <TabsContent
              value="disk"
              className="space-y-2 mt-4"
            >
              <form
                onSubmit={handlePathSubmit}
                className="space-y-2"
              >
                <label
                  htmlFor="path-input"
                  className="text-sm font-medium"
                >
                  Enter disk path
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <Input
                      id="path-input"
                      type="text"
                      value={pathInput}
                      onChange={(e) => setPathInput(e.target.value)}
                      placeholder="/path/to/binary/file"
                      className="flex-1"
                    />
                    <RecentFilesDropdown
                      recentFiles={recentFiles}
                      onSelect={handleRecentFileSelect}
                    />
                  </div>
                  <Button type="submit">Open File</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the full path to a file on your server filesystem
                  {recentFiles.length > 0 && " or select from recent files"}
                </p>
              </form>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
