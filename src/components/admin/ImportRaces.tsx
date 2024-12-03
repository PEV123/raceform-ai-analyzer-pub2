import { Card } from "@/components/ui/card";
import { ImportActions } from "./components/ImportActions";
import { UpdateRaces } from "./components/UpdateRaces";
import { ImportProgress } from "./components/ImportProgress";
import { ClearRacesDialog } from "./components/ClearRacesDialog";
import { ImportResults } from "./components/ImportResults";
import { useState } from "react";
import { useImportRacesMutation } from "./mutations/useImportRacesMutation";
import { useClearRacesMutation } from "./mutations/useClearRacesMutation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportStats {
  totalRaces: number;
  successfulRaces: number;
  failedRaces: number;
  horseResults: {
    attempted: number;
    successful: number;
    failed: number;
  };
  distanceAnalysis: {
    attempted: number;
    successful: number;
    failed: number;
  };
}

const ImportRaces = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operation, setOperation] = useState("");
  const [importSummary, setImportSummary] = useState<ImportStats | null>(null);
  
  const importRaces = useImportRacesMutation();
  const clearRaces = useClearRacesMutation();

  const handleImport = async () => {
    setImportSummary(null);
    await importRaces.mutate({
      date,
      onProgress: (progress, operation) => {
        setProgress(progress);
        setOperation(operation);
        console.log(`Import progress: ${progress}% - ${operation}`);
      },
      onUpdateSummary: (summary: ImportStats) => {
        setImportSummary(summary);
        console.log('Import summary:', summary);
      }
    });
  };

  const handleClearRaces = async () => {
    await clearRaces.mutate(date, {
      onSuccess: () => {
        setShowClearDialog(false);
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Import Races</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ImportActions
              date={date}
              onDateSelect={setDate}
              onImport={handleImport}
              isImporting={importRaces.isPending}
              isClearingRaces={clearRaces.isPending}
            />
            
            <Button 
              variant="destructive"
              onClick={() => setShowClearDialog(true)}
              disabled={importRaces.isPending || clearRaces.isPending}
            >
              Clear Races
            </Button>
          </div>
          
          <UpdateRaces />
          
          <ImportResults />
        </div>

        {importRaces.isPending && (
          <ImportProgress 
            progress={progress} 
            operation={operation}
            summary={importSummary}
          />
        )}

        {importSummary && !importRaces.isPending && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Import completed. Check the summary above for details.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <ClearRacesDialog
        isOpen={showClearDialog}
        onOpenChange={setShowClearDialog}
        onConfirm={handleClearRaces}
        date={date}
        isLoading={clearRaces.isPending}
      />
    </Card>
  );
};

export default ImportRaces;