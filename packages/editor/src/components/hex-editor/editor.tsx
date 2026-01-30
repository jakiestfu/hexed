"use client"

import { useEffect, useRef, useState } from "react"
import type { FunctionComponent } from "react"

import { HexCanvasReact } from "@hexed/canvas-react"
// import { HexToolbarSearch } from "./hex-toolbar-search"
import { plugins, visualizations } from "@hexed/plugins/core"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  cn,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tabs,
  TabsContent
} from "@hexed/ui"
import { Workbench, template as workbenchTemplate } from "@hexed/workbench"

// import { useGlobalKeyboard } from "../../hooks/use-global-keyboard"
import { useHexedFileContext } from "../../providers/hexed-file-provider"
import { useHexedSettingsContext } from "../../providers/hexed-settings-provider"
import { useHexedStateContext } from "../../providers/hexed-state-provider"
import type { EditorProps } from "../../types"
import { Logo } from "../common/logo"
import { EmptyState } from "../file/empty-state"
import { HexFooter } from "./hex-footer"
import { HexSidebar } from "./hex-sidebar"
import { HexToolbar } from "./hex-toolbar"

export const Editor: FunctionComponent<EditorProps> = ({
  className = "",
  fileSource = "file-system"
}) => {
  const {
    input: { hexedFile, handleId },
    onChangeInput
  } = useHexedFileContext()
  const { showAscii, sidebar, sidebarPosition, view, theme } =
    useHexedSettingsContext()
  const state = useHexedStateContext()

  const canRender = Boolean(hexedFile)

  // Global keyboard shortcuts
  // useGlobalKeyboard({
  //   data: new Uint8Array()
  // })

  // Window size for chunked file loading
  const windowSize = 1024 * 128

  // Container ref for dimensions tracking (for sidebar)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Track container dimensions for sidebar
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        state.setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [state.setDimensions])

  // Sidebars only show in edit view, not in visualize view
  const isEditView = view === "edit" || view === null
  const hasSidebars = sidebar !== null && isEditView

  // Handle workbench content changes
  const [workbenchValue, setWorkbenchValue] = useState<string>(() =>
    workbenchTemplate()
  )

  const workbenchPanel = (
    <ResizablePanel
      id="workbench"
      defaultSize={70}
      minSize={20}
      className={sidebar ? "hidden md:flex" : ""}
    >
      <div className="h-full w-full">
        {hexedFile ? (
          <Workbench
            value={workbenchValue}
            onChange={(v) => {
              setWorkbenchValue(v ?? "")
            }}
            height="100%"
            className="h-full"
            theme={theme === "dark" ? "vs-dark" : "vs"}
            hexedFile={hexedFile}
            visualizations={visualizations}
          />
        ) : null}
      </div>
    </ResizablePanel>
  )

  const hexCanvasPanel = (
    <ResizablePanel
      id="hex-canvas"
      defaultSize={70}
      minSize={20}
      className={sidebar ? "hidden md:flex" : ""}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
      >
        <HexCanvasReact
          ref={state.canvasRef}
          hexedFile={hexedFile}
          showAscii={showAscii}
          windowSize={windowSize}
          selectedOffsetRange={state.selectedOffsetRange}
          onSelectionChange={(payload) => {
            state.setSelectedOffsetRange(payload.range)
          }}
        />
      </div>
    </ResizablePanel>
  )

  // Sidebar component - only render when we have data and in edit view
  const sidebarPanel =
    hasSidebars && canRender && isEditView ? (
      <HexSidebar
        defaultSize={30}
        minSize={30}
        fileId={handleId ?? undefined}
        plugins={plugins}
      />
    ) : null

  const mainContent = view === "visualize" ? workbenchPanel : hexCanvasPanel

  return (
    <Card
      className={`p-0 m-0 w-full h-full rounded-none border-none shadow-none overflow-hidden ${className}`}
    >
      <Tabs
        value={state.activeTab}
        onValueChange={state.setActiveTab}
        className="gap-0 h-full"
      >
        <CardHeader className="p-0! gap-0 m-0 bg-muted/30 relative">
          <HexToolbar
            plugins={plugins}
            left={<Logo plugins={plugins} />}
            file={hexedFile}
            fileSource={fileSource}
            isConnected={Boolean(hexedFile?.getHandle())}
            error={null}
            onRestartWatching={() => {}}
            onClose={() => onChangeInput(null)}
          />
          {/* <HexToolbarTabs snapshots={snapshots} /> */}
        </CardHeader>

        <CardContent className="grow min-h-0 overflow-auto p-0">
          {!canRender ? <EmptyState onChangeInput={onChangeInput} /> : null}

          <TabsContent
            value="0"
            className={cn("h-full", !canRender && "hidden")}
          >
            {sidebarPosition === "left" ? (
              <>
                <ResizablePanelGroup
                  direction="horizontal"
                  className="h-full"
                >
                  {sidebarPanel}
                  {hasSidebars && (
                    <ResizableHandle
                      className={sidebar ? "hidden md:flex" : ""}
                      withHandle
                    />
                  )}
                  {mainContent}
                </ResizablePanelGroup>
              </>
            ) : (
              <>
                <ResizablePanelGroup
                  direction="horizontal"
                  className="h-full"
                >
                  {mainContent}
                  {hasSidebars && (
                    <ResizableHandle
                      className={sidebar ? "hidden md:flex" : ""}
                      withHandle
                    />
                  )}
                  {sidebarPanel}
                </ResizablePanelGroup>
              </>
            )}
          </TabsContent>
        </CardContent>

        <CardFooter
          className={cn(
            "p-0",
            canRender
              ? "opacity-100"
              : "opacity-0 transition-all duration-700 pointer-events-none"
          )}
        >
          <HexFooter plugins={plugins} />
        </CardFooter>
      </Tabs>
    </Card>
  )
}
