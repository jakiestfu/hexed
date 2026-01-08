import { Button } from "@hexed/ui";
import { Ghost } from "lucide-react";
import { FunctionComponent } from "react";

export const Logo: FunctionComponent = () => (
  <div className="flex items-center gap-2">
    <Button variant="ghost">
      <Ghost />
      <span>Hexed</span>
    </Button>
  </div>
);
