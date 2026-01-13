"use client";

import { DragDropProvider } from "~/components/hex-editor/drag-drop-provider";
import { WorkerProvider } from "~/providers/worker-provider";

export function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkerProvider>
      <DragDropProvider>{children}</DragDropProvider>
    </WorkerProvider>
  );
}
