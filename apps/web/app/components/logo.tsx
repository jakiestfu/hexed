"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hexed/ui";
import { Ghost, Github, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { FunctionComponent, ReactNode } from "react";

export interface LogoMenuItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export interface LogoProps {
  menuItems?: LogoMenuItem[];
  githubUrl?: string;
}

export const Logo: FunctionComponent<LogoProps> = ({
  menuItems,
  githubUrl = "https://github.com/jakiestfu/hexed",
}) => {
  const { setTheme } = useTheme();
  const hasDropdown = (menuItems && menuItems.length > 0) || githubUrl;

  const buttonContent = (
    <Button variant="ghost">
      <Ghost />
      <span className="font-mono font-bold">hexed</span>
    </Button>
  );

  if (!hasDropdown) {
    return <div className="flex justify-center gap-2">{buttonContent}</div>;
  }

  return (
    <div className="flex justify-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{buttonContent}</DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {menuItems?.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className="cursor-pointer"
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
          {menuItems && menuItems.length > 0 && <DropdownMenuSeparator />}
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
                  <Github />
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
