import * as React from "react"
import { ThemeProvider } from "next-themes"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { DragDropProvider } from "~/components/hex-editor/drag-drop-provider"
import { FileManagerProvider } from "~/providers/file-manager-provider"
import { WorkerProvider } from "~/providers/worker-provider"
import { HexEditorPage } from "~/routes/hex-editor-page"

const editor = <HexEditorPage />

const router = createBrowserRouter([
  {
    path: "/",
    element: editor
  },
  {
    path: "/edit/:id",
    element: editor
  }
])

export const App = () => (
  <WorkerProvider>
    <FileManagerProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <DragDropProvider>
          <RouterProvider router={router} />
        </DragDropProvider>
      </ThemeProvider>
    </FileManagerProvider>
  </WorkerProvider>
)
