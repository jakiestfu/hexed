import { formatFileSize } from "@hexed/file/formatter";
import { HexedPluginComponent } from "../types";
import { createHexedEditorPlugin } from "..";
import { FileDigit } from "lucide-react";


export const FileSize: HexedPluginComponent = ({ file }) => (
  <div className="items-center gap-2 font-mono hidden md:flex flex-col">
    <span className="text-xs text-muted-foreground">
      {formatFileSize(file.size)}
    </span>
  </div>
)

export const fileSizePlugin = createHexedEditorPlugin({
  type: "label",
  id: "file-size",
  title: "File Size",
  icon: FileDigit,
  component: FileSize
})
