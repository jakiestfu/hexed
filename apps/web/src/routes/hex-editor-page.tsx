import * as React from "react"
import { useTheme } from "next-themes"
import { useNavigate, useParams } from "react-router-dom"

import { HexEditor } from "@hexed/editor"

// import { StreamFileTest } from "~/components/stream-file-test"
import packageJson from "../../package.public.json"

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

  return (
    <div className="flex flex-col h-full">
      {/* {handleId && (
        <div className="p-2 border-b">
          <StreamFileTest />
        </div>
      )} */}
      <div className="flex-1">
        <HexEditor
          handleId={handleId}
          onClose={handleId ? handleClose : undefined}
          fileSource="file-system"
          onHandleIdChange={handleHandleReady}
          theme={theme}
          setTheme={setTheme}
          packageInfo={packageJson}
        />
      </div>
    </div>
  )
}
