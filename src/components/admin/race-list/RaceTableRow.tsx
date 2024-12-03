import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { RaceDocumentsCell } from "../RaceDocumentsCell";
import { RaceActionButtons } from "../RaceActionButtons";
import { useImportRaceResultsMutation } from "../mutations/useImportRaceResultsMutation";
import { Loader2 } from "lucide-react";

type Race = Tables<"races"> & {
  race_documents: Tables<"race_documents">[];
  runners: Tables<"runners">[];
};

interface RaceTableRowProps {
  race: Race;
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

export const RaceTableRow = ({
  race,
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
}: RaceTableRowProps) => {
  const importRaceResults = useImportRaceResultsMutation();
  const raceTime = new Date(race.off_time);
  const now = new Date();
  const raceHasFinished = raceTime < now;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span>{race.course}</span>
          {race.race_id && (
            <span className="text-xs text-muted-foreground">
              ID: {race.race_id}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{formatTime(race.off_time)}</TableCell>
      <TableCell>{race.runners?.length || 0}</TableCell>
      <TableCell>
        {hasImportedResults(race) ? (
          <span className="text-green-600">
            {getImportedResultsCount(race)} results
          </span>
        ) : (
          <span className="text-gray-400">No results</span>
        )}
      </TableCell>
      <TableCell>
        {hasImportedAnalysis(race) ? (
          <span className="text-green-600">
            {getImportedAnalysisCount(race)} analyzed
          </span>
        ) : (
          <span className="text-gray-400">No analysis</span>
        )}
      </TableCell>
      <TableCell>
        <RaceDocumentsCell
          documents={race.race_documents}
          onUploadDocs={() => onUploadDocs(race)}
          onDeleteDocument={onDeleteDocument}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <RaceActionButtons
            race={race}
            onUploadDocs={() => onUploadDocs(race)}
            onViewRawData={() => onViewRawData(race)}
            onViewDbData={() => onViewDbData(race)}
            onImportHorseResults={() => onImportHorseResults(race)}
            onImportDistanceAnalysis={() => onImportDistanceAnalysis(race)}
            hasImportedResults={hasImportedResults(race)}
            hasImportedAnalysis={hasImportedAnalysis(race)}
            isImportingResults={isImportingResults}
            isImportingAnalysis={isImportingAnalysis}
          />
          
          {raceHasFinished && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => importRaceResults.mutate(race)}
              disabled={importRaceResults.isPending}
            >
              {importRaceResults.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing Results
                </>
              ) : (
                "Import Results"
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};