import { useState } from "react";
import { HorseNameSearch } from "./horse-results/HorseNameSearch";
import { HorseIdSearch } from "./horse-results/HorseIdSearch";
import { ResultsTable } from "./horse-results/ResultsTable";
import { RawDataView } from "./horse-results/RawDataView";

export const HorseResults = () => {
  const [horseResults, setHorseResults] = useState<any[]>([]);
  const [rawApiData, setRawApiData] = useState<any>(null);

  const handleResults = (results: any[]) => {
    setHorseResults(results);
  };

  const handleRawData = (data: any) => {
    setRawApiData(data);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <HorseNameSearch 
          onSelectHorse={(horseId) => handleResults([])} 
          onRawData={handleRawData}
        />
        <HorseIdSearch 
          onResults={handleResults}
          onRawData={handleRawData}
        />
      </div>

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