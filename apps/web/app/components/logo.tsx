"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hexed/ui";
import {
  ChevronDown,
  Ghost,
  Github,
  Home,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FunctionComponent, ReactNode } from "react";

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
  const effectiveMenuItems =
    menuItems && menuItems.length > 0 ? menuItems : defaultMenuItems;
  const hasDropdown =
    (effectiveMenuItems && effectiveMenuItems.length > 0) || githubUrl;

  const inlineContent = (
    <>
      <Ghost />
      <span className="font-mono font-bold">hexed</span>
    </>
  );

  const buttonContent = (
    <Button variant="ghost">
      {inlineContent}
      <ChevronDown className="opacity-50 h-4 w-4" />
    </Button>
  );

  if (inline)
    return (
      <div className="flex justify-center items-center gap-2">
        {inlineContent}
      </div>
    );

  if (!hasDropdown) {
    return <div className="flex justify-center gap-2">{buttonContent}</div>;
  }

  return (
    <div className="flex justify-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{buttonContent}</DropdownMenuTrigger>
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
