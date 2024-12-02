import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { HorseHead } from "@/components/icons/HorseHead";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface HorseRacingMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMobileMenuClose?: () => void;
}

export const HorseRacingMenu = ({ isOpen, onOpenChange, onMobileMenuClose }: HorseRacingMenuProps) => {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      className="ml-4 space-y-2"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <HorseHead className="h-4 w-4" />
            <span>Horse Racing</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen ? "rotate-180" : ""
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 ml-4">
        <Link to="/" onClick={onMobileMenuClose}>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
          >
            UK/IRE
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          disabled
        >
          Australia (Coming Soon)
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};