"use client"

import { DragDropProvider } from "./hex-editor/drag-drop-provider"

export function ClientLayoutWrapper({
  children
}: {
  children: React.ReactNode
}) {
  return <DragDropProvider>{children}</DragDropProvider>
}
