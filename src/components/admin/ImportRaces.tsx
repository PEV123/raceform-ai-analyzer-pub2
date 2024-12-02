import { Card } from "@/components/ui/card";
import { ImportActions } from "./components/ImportActions";
import { UpdateRaces } from "./components/UpdateRaces";
import { ImportProgress } from "./components/ImportProgress";
import { ClearRacesDialog } from "./components/ClearRacesDialog";
import { useState } from "react";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";

const ImportRaces = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const importRaces = useImportRacesMutation();
  const clearRaces = useClearRacesMutation();

  const handleImport = async () => {
    await importRaces.mutate({
      date,
      onProgress: (progress, operation) => {
        setProgress(progress);
        console.log(`Import progress: ${progress}% - ${operation}`);
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Import Races</h2>
        
        <div className="space-y-4">
          <ImportActions
            date={date}
            onDateSelect={setDate}
            onImport={handleImport}
            isImporting={importRaces.isPending}
            isClearingRaces={clearRaces.isPending}
          />
          
          <UpdateRaces />
        </div>

        {importRaces.isPending && (
          <ImportProgress progress={progress} />
        )}
      </div>

      <ClearRacesDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
    </Card>
  );
};

export default ImportRaces;