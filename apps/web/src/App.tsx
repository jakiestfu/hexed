import { createHashRouter, RouterProvider } from "react-router-dom"

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
  <RouterProvider router={router} />
)
