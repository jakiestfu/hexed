"use client";

import {
  Button,
  DropdownMenu,
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
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FunctionComponent, ReactNode, useState } from "react";
import { useRecentFiles } from "~/hooks/use-recent-files";
import { encodeFilePath } from "~/utils/path-encoding";

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

const GlitchButton: FunctionComponent = () => {
  const [entered, setEntered] = useState(false);
  return (
    <div
      className="bg-red-400"
      onMouseEnter={() => setEntered(true)}
      onMouseLeave={() => setEntered(false)}
    >
      <Button variant="ghost">
        <Ghost />
        <span className="font-mono font-bold">
          <FuzzyText
            fontSize="1rem"
            baseIntensity={0}
            // hoverIntensity={0.5}
            glitchMode={entered}
            glitchInterval={1000}
            glitchDuration={100}
            enableHover={false}
          >
            hexed
          </FuzzyText>
        </span>
        <ChevronDown className="opacity-50 h-4 w-4" />
      </Button>
    </div>
  );
};

export const Logo: FunctionComponent<LogoProps> = ({
  menuItems,
  githubUrl = "https://github.com/jakiestfu/hexed",
  inline = false,
}) => {
  const { setTheme } = useTheme();
  const { recentFiles } = useRecentFiles();
  const effectiveMenuItems =
    menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;
  const hasDropdown =
    (effectiveMenuItems && effectiveMenuItems.length > 0) || githubUrl;

  if (inline)
    return (
      <div className="flex justify-center items-center gap-2">
        <Ghost />
        <span className="font-mono font-bold">hexed</span>
      </div>
    );

  return (
    <div className="flex justify-center gap-2">
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
              <File className="mr-2 h-4 w-4" />
              Recent Files
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
