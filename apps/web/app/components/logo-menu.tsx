"use client";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@hexed/ui";
import {
  File,
  Github,
  Home,
  Monitor,
  Moon,
  Palette,
  Sun,
  FolderOpen,
  BarChart3,
  CaseSensitive,
  Binary,
  FileText,
  Type,
  PanelLeft,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FunctionComponent, ReactNode } from "react";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { useChecksumVisibility } from "~/hooks/use-checksum-visibility";
import { useAsciiVisibility } from "~/hooks/use-ascii-visibility";
import { useInterpreterVisibility } from "~/hooks/use-interpreter-visibility";
import { useTemplatesVisibility } from "~/hooks/use-templates-visibility";
import { useStringsVisibility } from "~/hooks/use-strings-visibility";
import { useSidebarPosition } from "~/hooks/use-sidebar-position";
import { encodeFilePath } from "~/utils/path-encoding";
import type { BinarySnapshot } from "@hexed/types";
import { Histogram } from "~/components/hex-editor/histogram";
import { Hotkeys } from "~/utils/hotkey-format";

export type LogoMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
};

export type LogoMenuProps = {
  menuItems?: LogoMenuItem[];
  githubUrl?: string;
  currentSnapshot?: BinarySnapshot | null;
  showHistogram: boolean;
  onShowHistogramChange: (show: boolean) => void;
};

const isInternalLink = (href: string): boolean => {
  return href.startsWith("/");
};

const defaultMenuItems: LogoMenuItem[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home className="mr-2 h-4 w-4" />,
  },
];

export const LogoMenu: FunctionComponent<LogoMenuProps> = ({
  menuItems,
  githubUrl = "https://github.com/jakiestfu/hexed",
  currentSnapshot,
  showHistogram,
  onShowHistogramChange,
}) => {
  const { theme, setTheme } = useTheme();
  const { recentFiles } = useRecentFiles();
  const { showChecksums, setShowChecksums } = useChecksumVisibility();
  const { showAscii, setShowAscii } = useAsciiVisibility();
  const { showInterpreter, setShowInterpreter } = useInterpreterVisibility();
  const { showTemplates, setShowTemplates } = useTemplatesVisibility();
  const { showStrings, setShowStrings } = useStringsVisibility();
  const { sidebarPosition, setSidebarPosition } = useSidebarPosition();

  const effectiveMenuItems =
    menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;

  // Determine active sidebar panel
  const activeSidebarPanel = showInterpreter
    ? "interpreter"
    : showTemplates
    ? "templates"
    : showStrings
    ? "strings"
    : null;

  const handleSidebarPanelChange = (value: string) => {
    setShowInterpreter(false);
    setShowTemplates(false);
    setShowStrings(false);

    switch (value) {
      case "interpreter":
        setShowInterpreter(true);
        break;
      case "templates":
        setShowTemplates(true);
        break;
      case "strings":
        setShowStrings(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <DropdownMenuContent align="start">
        {effectiveMenuItems?.map((item, index) => {
          if (item.href) {
            const isInternal = isInternalLink(item.href);
            const content = (
              <>
                {item.icon}
                {item.label}
              </>
            );

            if (isInternal) {
              return (
                <DropdownMenuItem key={index} asChild>
                  <Link
                    href={item.href}
                    onClick={item.onClick}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {content}
                  </Link>
                </DropdownMenuItem>
              );
            } else {
              return (
                <DropdownMenuItem key={index} asChild>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={item.onClick}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {content}
                  </a>
                </DropdownMenuItem>
              );
            }
          }

          return (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className="cursor-pointer"
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          );
        })}
        {effectiveMenuItems && effectiveMenuItems.length > 0 && (
          <DropdownMenuSeparator />
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <FolderOpen className="mr-2 h-4 w-4" />
            Open Recent
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {recentFiles.length > 0 ? (
              recentFiles.map((file) => {
                const encodedPath = encodeFilePath(file.path);
                const basename = file.path.split("/").pop() || file.path;
                return (
                  <DropdownMenuItem key={file.path} asChild>
                    <Link
                      href={`/edit/${encodedPath}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <File className="mr-2 h-4 w-4" />
                      {basename}
                    </Link>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground">
                No recent files
              </DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <CaseSensitive className="mr-2 h-4 w-4" />
            Hex Editor
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              checked={showAscii}
              onCheckedChange={setShowAscii}
              className="cursor-pointer"
            >
              Show ASCII
              <DropdownMenuShortcut>
                {Hotkeys.toggleAscii()}
              </DropdownMenuShortcut>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showChecksums}
              onCheckedChange={setShowChecksums}
              className="cursor-pointer"
            >
              Show Checksums
              <DropdownMenuShortcut>
                {Hotkeys.toggleChecksums()}
              </DropdownMenuShortcut>
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem
              onClick={() => onShowHistogramChange(true)}
              disabled={!currentSnapshot?.data}
              className="cursor-pointer"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Show Histogram
              <DropdownMenuShortcut>
                {Hotkeys.toggleHistogram()}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <PanelLeft className="mr-2 h-4 w-4" />
            Sidebar
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={activeSidebarPanel || ""}
              onValueChange={handleSidebarPanelChange}
            >
              <DropdownMenuRadioItem
                value="interpreter"
                className="cursor-pointer"
              >
                <span className="flex items-center">
                  <Binary className="mr-2 h-4 w-4" />
                  Interpreter
                </span>
                <DropdownMenuShortcut>
                  {Hotkeys.toggleInterpreter()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="templates"
                className="cursor-pointer"
              >
                <span className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Templates
                </span>
                <DropdownMenuShortcut>
                  {Hotkeys.toggleTemplates()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="strings" className="cursor-pointer">
                <span className="flex items-center">
                  <Type className="mr-2 h-4 w-4" />
                  Strings
                </span>
                <DropdownMenuShortcut>
                  {Hotkeys.toggleStrings()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sidebarPosition}
              onValueChange={(value) =>
                setSidebarPosition(value as "left" | "right")
              }
            >
              <DropdownMenuRadioItem value="left" className="cursor-pointer">
                Position: Left
                <DropdownMenuShortcut>
                  {Hotkeys.toggleSidebarPosition()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="right" className="cursor-pointer">
                Position: Right
                <DropdownMenuShortcut>
                  {Hotkeys.toggleSidebarPosition()}
                </DropdownMenuShortcut>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme || "system"}
              onValueChange={(value) => setTheme(value)}
            >
              <DropdownMenuRadioItem value="light" className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system" className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {githubUrl && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      {currentSnapshot?.data && (
        <Dialog open={showHistogram} onOpenChange={onShowHistogramChange}>
          <DialogContent className="max-w-none! w-[90vw] p-0 overflow-hidden">
            <Histogram data={currentSnapshot.data} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
