import { useState } from "react";
import { HorseNameSearch } from "./horse-results/HorseNameSearch";
import { HorseIdSearch } from "./horse-results/HorseIdSearch";
import { ResultsTable } from "./horse-results/ResultsTable";
import { RawDataView } from "./horse-results/RawDataView";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const HorseResults = () => {
  const [horseResults, setHorseResults] = useState<any[]>([]);
  const [rawApiData, setRawApiData] = useState<any>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);

  const handleResults = (results: any[]) => {
    console.log("Setting horse results:", results);
    setHorseResults(results);
  };

  const handleRawData = (data: any) => {
    console.log("Setting raw API data:", data);
    setRawApiData(data);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <HorseNameSearch 
          onSelectHorse={(horseId) => {
            setSelectedHorseId(horseId);
            handleResults([]);
          }} 
          onRawData={handleRawData}
        />
        <HorseIdSearch 
          onResults={handleResults}
          onRawData={handleRawData}
        />
      </div>

      {selectedHorseId && horseResults.length === 0 && (
        <Alert>
          <AlertDescription>
            No historical results found for this horse. This could be because the horse is new or hasn't raced yet.
          </AlertDescription>
        </Alert>
      )}

      {horseResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Race Results</h3>
          <ResultsTable results={horseResults} />
        </div>
      )}

      <RawDataView data={rawApiData} />
    </div>
  );
};