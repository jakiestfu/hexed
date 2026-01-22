import { FunctionComponent } from "react"

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@hexed/ui"

export const AboutFileSystemAccessDialog: FunctionComponent<{
  open: boolean
  onOpenChange: (open: boolean) => void
}> = ({ open, onOpenChange }) => (
  <Dialog
    open={open}
    onOpenChange={onOpenChange}
  >
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>About File System Access API</DialogTitle>
        <DialogDescription>
          A local-first approach to file access. All data stays on your device.
          No uploads, no cloud storage, no server communication.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <h3 className="font-semibold text-sm mb-2">What is it?</h3>
          <p className="text-sm text-muted-foreground">
            The File System Access API is a web standard that allows web
            applications to read and write files and directories on the user's
            device with their explicit permission. It provides a native-like
            file access experience directly in the browser.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-2">Why is it used?</h3>
          <p className="text-sm text-muted-foreground">
            This API enables persistent file access with user permission. Once
            granted, files can be reopened without re-prompting, enabling
            local-first workflows. File handles are stored client-side, allowing
            quick access to recently opened files and change tracking without
            exposing data to external servers.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-2">Storage</h3>
          <p className="text-sm text-muted-foreground">
            File handles are securely stored in IndexedDB (database name:
            "hexed-file-handles"). You can inspect this data in your browser's
            Developer Tools under Application → IndexedDB. The handles are
            stored locally on your device and never sent to any server.
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto"
          >
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more on MDN
            </a>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)
