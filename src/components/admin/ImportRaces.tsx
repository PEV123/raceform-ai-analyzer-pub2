import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { ClearRacesDialog } from "./components/ClearRacesDialog";
import { ImportProgress } from "./components/ImportProgress";
import { ImportActions } from "./components/ImportActions";

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

        <ImportActions
          date={date}
          onDateSelect={(newDate) => {
            if (newDate) {
              const ukDate = fromZonedTime(newDate, 'Europe/London');
              console.log('New UK date selected:', formatInTimeZone(ukDate, 'Europe/London', 'yyyy-MM-dd'));
              setDate(ukDate);
            }
          }}
          onImport={handleImport}
          isImporting={importMutation.isPending}
          isClearingRaces={clearMutation.isPending}
        />
      </div>

      {importMutation.isPending && (
        <ImportProgress
          progress={progress}
          operation={currentOperation}
        />
      )}
    </Card>
  );
};

export default ImportRaces;