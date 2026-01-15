import * as React from "react"
import { useTheme } from "next-themes"
import { useNavigate, useParams } from "react-router-dom"

import { HexEditor } from "@hexed/editor"
import { createLogger } from "@hexed/logger"

import packageJson from "../../package.public.json"

const logger = createLogger("HexEditorPage")

export function HexEditorPage() {
  const { id: handleId } = useParams()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  // Memoized callbacks
  const handleClose = React.useCallback(() => {
    navigate("/")
  }, [navigate])

  const handleHandleReady = React.useCallback(
    (handleId: string | null) => {
      if (!handleId) {
        navigate("/")
        return
      }
      navigate(`/edit/${handleId}`)
    },
    [navigate]
  )

  logger.log("Rendering HexEditorPage")
  return (
    <HexEditor
      handleId={handleId}
      onClose={handleId ? handleClose : undefined}
      fileSource="file-system"
      onHandleIdChange={handleHandleReady}
      theme={theme}
      setTheme={setTheme}
      packageInfo={packageJson}
    />
  )
}
