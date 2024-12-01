import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { DateSelector } from "./components/DateSelector";
import { ClearRacesDialog } from "./components/ClearRacesDialog";

const ImportRaces = () => {
  const clearMutation = useClearRacesMutation();
  const importMutation = useImportRacesMutation();
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [clearDate, setClearDate] = useState<Date | undefined>();
  
  // Initialize with current UK date
  const [date, setDate] = useState<Date>(() => {
    const ukDate = fromZonedTime(new Date(), 'Europe/London');
    console.log('Initial UK date set to:', formatInTimeZone(ukDate, 'Europe/London', 'yyyy-MM-dd'));
    return ukDate;
  });

  const { data: settings } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleImport = async () => {
    await importMutation.mutateAsync({
      date,
      onProgress: (progress: number, operation: string) => {
        setProgress(progress);
        setCurrentOperation(operation);
      }
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Import Races</h2>
      <p className="text-muted-foreground mb-4">
        Import races from the Racing API for a specific date
      </p>
      <div className="flex gap-4 mb-6">
        <ClearRacesDialog
          clearDate={clearDate}
          setClearDate={setClearDate}
          onClear={(date) => clearMutation.mutate(date)}
          isPending={clearMutation.isPending}
        />

        <div className="flex gap-2">
          <DateSelector
            date={date}
            onSelect={(newDate) => {
              if (newDate) {
                // Convert the selected date to UK timezone
                const ukDate = fromZonedTime(newDate, 'Europe/London');
                console.log('New UK date selected:', formatInTimeZone(ukDate, 'Europe/London', 'yyyy-MM-dd'));
                setDate(ukDate);
              }
            }}
            disabled={importMutation.isPending}
          />

          <Button
            onClick={handleImport}
            disabled={clearMutation.isPending || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Races"
            )}
          </Button>
        </div>
      </div>

      {importMutation.isPending && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{currentOperation}</p>
        </div>
      )}
    </Card>
  );
};

export default ImportRaces;