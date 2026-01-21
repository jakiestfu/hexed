import { ThemeProvider } from "next-themes"
import { createHashRouter, RouterProvider } from "react-router-dom"

import { DragDropProvider } from "@hexed/editor"

import { WorkerProvider } from "~/providers/worker-provider"
import { HexEditorPage } from "~/routes/hex-editor-page"

const editor = <HexEditorPage />

const router = createHashRouter([
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
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    <WorkerProvider>
      <DragDropProvider>
        <RouterProvider router={router} />
      </DragDropProvider>
    </WorkerProvider>
  </ThemeProvider>
)
