import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DateSelector } from "./DateSelector";

interface ImportActionsProps {
  date: Date;
  onDateSelect: (date: Date | undefined) => void;
  onImport: () => void;
  isImporting: boolean;
  isClearingRaces: boolean;
}

export const ImportActions = ({
  date,
  onDateSelect,
  onImport,
  isImporting,
  isClearingRaces
}: ImportActionsProps) => {
  return (
    <div className="flex gap-2">
      <DateSelector
        date={date}
        onSelect={(newDate) => {
          if (newDate) {
            onDateSelect(newDate);
          }
        }}
        disabled={isImporting}
      />

      <Button
        onClick={onImport}
        disabled={isClearingRaces || isImporting}
      >
        {isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          "Import Races"
        )}
      </Button>
    </div>
  );
};