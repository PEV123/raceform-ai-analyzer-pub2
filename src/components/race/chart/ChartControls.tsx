import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SortOption = "number" | "win" | "place" | "speed" | "overall";

interface ChartControlsProps {
  onSortChange: (value: SortOption) => void;
  currentSort: SortOption;
}

export const ChartControls = ({ onSortChange, currentSort }: ChartControlsProps) => {
  return (
    <ToggleGroup 
      type="single" 
      value={currentSort}
      onValueChange={(value) => value && onSortChange(value as SortOption)}
      className="justify-start mb-4"
    >
      <ToggleGroupItem value="number" aria-label="Sort by number">
        Number Order
      </ToggleGroupItem>
      <ToggleGroupItem value="win" aria-label="Sort by win percentage">
        Win %
      </ToggleGroupItem>
      <ToggleGroupItem value="place" aria-label="Sort by place percentage">
        Place %
      </ToggleGroupItem>
      <ToggleGroupItem value="speed" aria-label="Sort by speed rating">
        Speed Rating
      </ToggleGroupItem>
      <ToggleGroupItem value="overall" aria-label="Sort by overall metrics">
        All Metrics
      </ToggleGroupItem>
    </ToggleGroup>
  );
};