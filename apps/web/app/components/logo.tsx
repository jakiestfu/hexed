import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hexed/ui";
import { Ghost, Github } from "lucide-react";
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
          {menuItems && menuItems.length > 0 && githubUrl && (
            <DropdownMenuSeparator />
          )}
          {githubUrl && (
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
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
