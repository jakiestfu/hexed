import { Button } from "@hexed/ui";
import { Ghost } from "lucide-react";
import { FunctionComponent } from "react";

export const Logo: FunctionComponent = () => (
  <div className="flex justify-center gap-2">
    <Button variant="ghost">
      <Ghost />
      <span className="font-mono font-bold">hexed</span>
    </Button>
  </div>
);
