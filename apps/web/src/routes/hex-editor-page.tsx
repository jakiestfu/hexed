import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

import { HexEditor } from "@hexed/editor"
import { createLogger } from "@hexed/logger"

import { Logo } from "~/components/logo"
import { decodeHandleId, encodeHandleId } from "~/utils/path-encoding"

const logger = createLogger("HexEditorPage")

export function HexEditorPage() {
  const params = useParams()
  const navigate = useNavigate()

  // Get handle ID from URL parameter
  const handleId = React.useMemo(() => {
    const idParam = params.id
    if (!idParam) return null
    return decodeHandleId(idParam)
  }, [params.id])

  const [showHistogram, setShowHistogram] = React.useState(false)

  // Memoized callbacks
  const handleClose = React.useCallback(() => {
    navigate("/")
  }, [navigate])

  const handleHandleReady = React.useCallback(
    (handleId: string) => {
      const encodedHandleId = encodeHandleId(handleId)
      navigate(`/edit/${encodedHandleId}`)
    },
    [navigate]
  )
  logger.log("Rendering HexEditorPage")
  return (
    <HexEditor
      handleId={handleId}
      onClose={handleId ? handleClose : undefined}
      fileSource="file-system"
      onHandleReady={handleHandleReady}
      logo={
        <Logo
          showHistogram={showHistogram}
          onShowHistogramChange={setShowHistogram}
        />
      }
    />
  )
}
