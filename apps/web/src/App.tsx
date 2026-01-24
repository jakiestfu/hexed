import { createHashRouter, RouterProvider } from "react-router-dom"

import { Brand } from "@hexed/editor"

import { HexedBrandRoute } from "~/routes/brand-route"
import { HexEditorPage } from "~/routes/hex-editor-page"

const editor = <HexEditorPage />
const brand = <HexedBrandRoute />

const router = createHashRouter([
  {
    path: "/",
    element: editor
  },
  {
    path: "/edit/:id",
    element: editor
  },
  {
    path: "/brand",
    element: brand
  }
])

export const App = () => <RouterProvider router={router} />
