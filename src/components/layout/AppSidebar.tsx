import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SportsMenu } from "./sidebar/SportsMenu";
import { MobileNav } from "./sidebar/MobileNav";

export function AppSidebar() {
  const [isSportsOpen, setIsSportsOpen] = useState(true);
  const [isHorseRacingOpen, setIsHorseRacingOpen] = useState(true);

  return (
    <div className="border-r bg-background p-4 pt-8 hidden md:block w-[250px] overflow-y-auto">
      <div className="space-y-4">
        <Link to="/">
          <Button
            variant="ghost"
            className="w-full justify-start font-semibold"
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </Button>
        </Link>

        <SportsMenu
          isOpen={isSportsOpen}
          onOpenChange={setIsSportsOpen}
          isHorseRacingOpen={isHorseRacingOpen}
          onHorseRacingOpenChange={setIsHorseRacingOpen}
        />
      </div>
    </div>
  );
}

export { MobileNav };