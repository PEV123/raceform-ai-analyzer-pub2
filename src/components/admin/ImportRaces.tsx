import { Card } from "@/components/ui/card";
import { ImportActions } from "./components/ImportActions";
import { UpdateRaces } from "./components/UpdateRaces";
import { ImportProgress } from "./components/ImportProgress";
import { ClearRacesDialog } from "./components/ClearRacesDialog";
import { useState } from "react";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface UpdateSummary {
  nonRunnerUpdates: {
    raceId: string;
    course: string;
    count: number;
  }[];
  oddsUpdates: {
    raceId: string;
    course: string;
    count: number;
  }[];
}

const ImportRaces = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operation, setOperation] = useState("");
  const [updateSummary, setUpdateSummary] = useState<UpdateSummary | null>(null);
  
  const importRaces = useImportRacesMutation();
  const clearRaces = useClearRacesMutation();

  const handleImport = async () => {
    setUpdateSummary(null);
    await importRaces.mutate({
      date,
      onProgress: (progress, operation) => {
        setProgress(progress);
        setOperation(operation);
        console.log(`Import progress: ${progress}% - ${operation}`);
      },
      onUpdateSummary: (summary: UpdateSummary) => {
        setUpdateSummary(summary);
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
          <ImportProgress progress={progress} operation={operation} />
        )}

        {updateSummary && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Update Summary:
              </AlertDescription>
            </Alert>
            
            {updateSummary.nonRunnerUpdates.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Non-Runner Updates:</h3>
                {updateSummary.nonRunnerUpdates.map((update, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {update.course}: {update.count} non-runners updated
                  </p>
                ))}
              </div>
            )}
            
            {updateSummary.oddsUpdates.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Odds Updates:</h3>
                {updateSummary.oddsUpdates.map((update, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {update.course}: {update.count} runners with updated odds
                  </p>
                ))}
              </div>
            )}

            {updateSummary.nonRunnerUpdates.length === 0 && updateSummary.oddsUpdates.length === 0 && (
              <p className="text-sm text-muted-foreground">No updates were required.</p>
            )}
          </div>
        )}
      </div>

      <ClearRacesDialog
        isOpen={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
    </Card>
  );
};

export default ImportRaces;