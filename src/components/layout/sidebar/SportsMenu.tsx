import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { HorseRacingMenu } from "./HorseRacingMenu";
import { Basketball } from "@/components/icons/Basketball";

interface SportsMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isHorseRacingOpen: boolean;
  onHorseRacingOpenChange: (open: boolean) => void;
  onMobileMenuClose?: () => void;
}

export const SportsMenu = ({
  isOpen,
  onOpenChange,
  isHorseRacingOpen,
  onHorseRacingOpenChange,
  onMobileMenuClose,
}: SportsMenuProps) => {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
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
              isOpen ? "rotate-180" : ""
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        <HorseRacingMenu
          isOpen={isHorseRacingOpen}
          onOpenChange={onHorseRacingOpenChange}
          onMobileMenuClose={onMobileMenuClose}
        />
        <Button
          variant="ghost"
          className="w-full justify-start ml-4"
          disabled
        >
          <div className="flex items-center gap-2">
            <Basketball className="h-4 w-4" />
            <span>NBA (Coming Soon)</span>
          </div>
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};