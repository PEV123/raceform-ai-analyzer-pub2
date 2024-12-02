import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateSelector } from "./DateSelector";
import { useImportRacesMutation } from "../mutations/useImportRacesMutation";

export const UpdateRaces = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const importRaces = useImportRacesMutation();
  const [progress, setProgress] = useState(0);

  const handleUpdate = async () => {
    try {
      await importRaces.mutate({
        date,
        onProgress: (progress, operation) => {
          setProgress(progress);
          console.log(`Update progress: ${progress}% - ${operation}`);
        }
      });
    } catch (error) {
      console.error('Error updating races:', error);
      toast({
        title: "Error",
        description: "Failed to update races",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <DateSelector
        date={date}
        onSelect={(newDate) => {
          if (newDate) {
            setDate(newDate);
          }
        }}
        disabled={importRaces.isPending}
      />

      <Button
        onClick={handleUpdate}
        disabled={importRaces.isPending}
      >
        {importRaces.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Races ({Math.round(progress)}%)
          </>
        ) : (
          "Update Races"
        )}
      </Button>
    </div>
  );
};