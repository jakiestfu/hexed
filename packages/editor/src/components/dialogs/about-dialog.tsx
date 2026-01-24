import { FunctionComponent } from "react"
import { Github, Share2 } from "lucide-react"

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@hexed/ui"

import packageJson from "../../../../../package.public.json"
import { Ascii } from "../common/ascii"
import { Brand } from "../common/logo"

export const AboutDialog: FunctionComponent<{
  open: boolean
  onOpenChange: (open: boolean) => void
}> = ({ open, onOpenChange }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hexed",
          text: packageJson.description,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled or error occurred - silently fail
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error)
        }
      }
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">
            About {packageJson.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Brand />
          <p className="text-muted-foreground max-w-xs">
            {packageJson.description}
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            Version {packageJson.version}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-8 w-full sm:w-auto">
            <Button
              variant="outline"
              asChild
              className="flex items-center gap-2"
            >
              <a
                href={packageJson.repository.url.replace(".git", "")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
            {canShare && (
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {/* Share */}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
