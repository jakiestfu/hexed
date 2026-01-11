"use client";

import { MemoryProfiler } from "~/components/hex-editor/memory-profiler";

export default function MemoryProfilerPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex items-center gap-2 font-mono">
        <MemoryProfiler />
      </div>
    </div>
  );
}
