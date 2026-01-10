"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@hexed/ui";
import {
  ChevronDown,
  File,
  Ghost,
  Github,
  Home,
  Monitor,
  Moon,
  Palette,
  Sun,
  Settings,
  FolderOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FunctionComponent, ReactNode } from "react";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { useChecksumVisibility } from "~/hooks/use-checksum-visibility";
import { useAsciiVisibility } from "~/hooks/use-ascii-visibility";
import { useInterpreterVisibility } from "~/hooks/use-interpreter-visibility";
import { useTemplatesVisibility } from "~/hooks/use-templates-visibility";
import { useSidebarPosition } from "~/hooks/use-sidebar-position";
import { encodeFilePath } from "~/utils/path-encoding";
import { cn } from "@hexed/ui";

export type LogoMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
};

export type LogoProps = {
  menuItems?: LogoMenuItem[];
  githubUrl?: string;
  inline?: boolean;
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

export const Logo: FunctionComponent<LogoProps> = ({
  menuItems,
  githubUrl = "https://github.com/jakiestfu/hexed",
  inline = false,
}) => {
  const { setTheme } = useTheme();
  const { recentFiles } = useRecentFiles();
  const { showChecksums, setShowChecksums } = useChecksumVisibility();
  const { showAscii, setShowAscii } = useAsciiVisibility();
  const { showInterpreter, setShowInterpreter } = useInterpreterVisibility();
  const { showTemplates, setShowTemplates } = useTemplatesVisibility();
  const { sidebarPosition, setSidebarPosition } = useSidebarPosition();

  const effectiveMenuItems =
    menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;
  const hasDropdown =
    (effectiveMenuItems && effectiveMenuItems.length > 0) || githubUrl;

  if (inline)
    return (
      <div className="flex justify-center items-center gap-2 logo-container-inline">
        <Ghost />
        <span className="font-mono font-bold">hexed</span>
      </div>
    );

  return (
    <div className="flex justify-center gap-2 logo-container">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <Ghost />
            <span className="font-mono font-bold">hexed</span>
            <ChevronDown className="opacity-50 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
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
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuCheckboxItem
                checked={showAscii}
                onCheckedChange={setShowAscii}
                className="cursor-pointer"
              >
                Show ASCII
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showInterpreter}
                onCheckedChange={(value) => {
                  setShowInterpreter(value);
                  if (value) setShowTemplates(false);
                }}
                className="cursor-pointer"
              >
                Show Interpreter
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showTemplates}
                onCheckedChange={(value) => {
                  setShowTemplates(value);
                  if (value) setShowInterpreter(false);
                }}
                className="cursor-pointer"
              >
                Show Templates
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showChecksums}
                onCheckedChange={setShowChecksums}
                className="cursor-pointer"
              >
                Show Checksums
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sidebarPosition === "left"}
                onCheckedChange={(checked) =>
                  setSidebarPosition(checked ? "left" : "right")
                }
                className="cursor-pointer"
              >
                Sidebar on Left
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="cursor-pointer"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer"
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
      </DropdownMenu>
    </div>
  );
};
