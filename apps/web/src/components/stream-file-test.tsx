import * as React from "react"
import { useParams } from "react-router-dom"

import { useHandleIdToFileHandle, useWorkerClient } from "@hexed/editor"
import { Button, Progress } from "@hexed/ui"

export function StreamFileTest() {
  const { id: handleId } = useParams()
  const { fileHandle } = useHandleIdToFileHandle(handleId)
  const workerClient = useWorkerClient()

  const [isStreaming, setIsStreaming] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const handleStreamFile = React.useCallback(async () => {
    if (!workerClient || !fileHandle || !handleId) {
      return
    }

    setIsStreaming(true)
    setProgress(0)

    try {
      // Open file in worker if not already open
      // Use handleId as the fileId for consistency
      const fileId = handleId

      try {
        await workerClient.openFile(fileId, fileHandle)
      } catch (error) {
        // File might already be open, which is fine
        console.log("File may already be open:", error)
      }

      // Stream the file with progress updates
      await workerClient.streamFile(fileId, (progressValue) => {
        console.log("progressValue", progressValue)
        setProgress(progressValue)
      })
    } catch (error) {
      console.error("Failed to stream file:", error)
    } finally {
      setIsStreaming(false)
      setProgress(0)
    }
  }, [workerClient, fileHandle, handleId])

  // Don't render if no file is loaded
  if (!handleId || !fileHandle) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleStreamFile}
          disabled={isStreaming || !workerClient}
          size="sm"
        >
          {isStreaming ? `Streaming... ${progress}%` : "Stream File"}
        </Button>
      </div>
      {isStreaming && (
        <div className="w-full">
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground mt-1">
            {progress}% complete
          </div>
        </div>
      )}
    </div>
  )
}
