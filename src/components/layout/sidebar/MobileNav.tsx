import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { SportsMenu } from "./SportsMenu";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSportsOpen, setIsSportsOpen] = useState(true);
  const [isHorseRacingOpen, setIsHorseRacingOpen] = useState(true);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MenuIcon className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 top-[64px] z-50 bg-background border-r animate-in slide-in-from-left">
          <div className="p-4 space-y-4">
            <Link to="/" onClick={() => setIsOpen(false)}>
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
              onMobileMenuClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}