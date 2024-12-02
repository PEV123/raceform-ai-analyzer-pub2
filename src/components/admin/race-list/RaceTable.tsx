import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tables } from "@/integrations/supabase/types";
import { RaceTableRow } from "./RaceTableRow";

type Race = Tables<"races"> & {
  race_documents: Tables<"race_documents">[];
  runners: Tables<"runners">[];
};

interface RaceTableProps {
  races: Race[];
  formatTime: (date: string) => string;
  onUploadDocs: (race: Race) => void;
  onViewRawData: (race: Race) => void;
  onViewDbData: (race: Race) => void;
  onImportHorseResults: (race: Race) => void;
  onImportDistanceAnalysis: (race: Race) => void;
  hasImportedResults: (race: Race) => boolean;
  hasImportedAnalysis: (race: Race) => boolean;
  getImportedResultsCount: (race: Race) => number;
  getImportedAnalysisCount: (race: Race) => number;
  isImportingResults: boolean;
  isImportingAnalysis: boolean;
  onDeleteDocument: (doc: Tables<"race_documents">) => void;
}

export const RaceTable = ({
  races,
  formatTime,
  onUploadDocs,
  onViewRawData,
  onViewDbData,
  onImportHorseResults,
  onImportDistanceAnalysis,
  hasImportedResults,
  hasImportedAnalysis,
  getImportedResultsCount,
  getImportedAnalysisCount,
  isImportingResults,
  isImportingAnalysis,
  onDeleteDocument,
}: RaceTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Venue</TableHead>
          <TableHead>Race Time</TableHead>
          <TableHead>Number Runners</TableHead>
          <TableHead>Results Data</TableHead>
          <TableHead>Time Data</TableHead>
          <TableHead>Docs</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {races.map((race) => (
          <RaceTableRow
            key={race.id}
            race={race}
            formatTime={formatTime}
            onUploadDocs={onUploadDocs}
            onViewRawData={onViewRawData}
            onViewDbData={onViewDbData}
            onImportHorseResults={onImportHorseResults}
            onImportDistanceAnalysis={onImportDistanceAnalysis}
            hasImportedResults={hasImportedResults}
            hasImportedAnalysis={hasImportedAnalysis}
            getImportedResultsCount={getImportedResultsCount}
            getImportedAnalysisCount={getImportedAnalysisCount}
            isImportingResults={isImportingResults}
            isImportingAnalysis={isImportingAnalysis}
            onDeleteDocument={onDeleteDocument}
          />
        ))}
      </TableBody>
    </Table>
  );
};