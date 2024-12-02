import { Link } from "react-router-dom";
import {
  ChevronDown,
  Horse,
  MenuIcon,
  Basketball,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [isHorseRacingOpen, setIsHorseRacingOpen] = useState(true);
  const [isSportsOpen, setIsSportsOpen] = useState(true);

  return (
    <div className="h-screen border-r bg-background p-4 pt-8 hidden md:block w-[250px] overflow-y-auto">
      <div className="space-y-4">
        <Collapsible
          open={isSportsOpen}
          onOpenChange={setIsSportsOpen}
          className="space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between font-semibold"
            >
              <span>Sports</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isSportsOpen ? "rotate-180" : ""
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <Collapsible
              open={isHorseRacingOpen}
              onOpenChange={setIsHorseRacingOpen}
              className="ml-4 space-y-2"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <Horse className="h-4 w-4" />
                    <span>Horse Racing</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isHorseRacingOpen ? "rotate-180" : ""
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 ml-4">
                <Link to="/racing/uk-ire">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                  >
                    UK/IRE
                  </Button>
                </Link>
                <Link to="/racing/australia">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                  >
                    Australia
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Link to="/nba">
              <Button
                variant="ghost"
                className="w-full justify-start ml-4"
              >
                <div className="flex items-center gap-2">
                  <Basketball className="h-4 w-4" />
                  <span>NBA</span>
                </div>
              </Button>
            </Link>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

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
            <Collapsible defaultOpen className="space-y-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between font-semibold"
                >
                  <span>Sports</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <Collapsible defaultOpen className="ml-4 space-y-2">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <Horse className="h-4 w-4" />
                        <span>Horse Racing</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 ml-4">
                    <Link to="/racing/uk-ire" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                      >
                        UK/IRE
                      </Button>
                    </Link>
                    <Link to="/racing/australia" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                      >
                        Australia
                      </Button>
                    </Link>
                  </CollapsibleContent>
                </Collapsible>

                <Link to="/nba" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start ml-4"
                  >
                    <div className="flex items-center gap-2">
                      <Basketball className="h-4 w-4" />
                      <span>NBA</span>
                    </div>
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}
    </div>
  );
}