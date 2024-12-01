import { TableCell, TableRow } from "@/components/ui/table";
import { Tables } from "@/integrations/supabase/types";
import { formatInTimeZone } from 'date-fns-tz';
import { RaceActionButtons } from "../RaceActionButtons";
import { RaceDocumentsCell } from "../RaceDocumentsCell";

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
  isImportingResults,
  isImportingAnalysis,
  onDeleteDocument,
}: RaceTableRowProps) => {
  return (
    <TableRow key={race.id}>
      <TableCell>
        <div>
          {race.course}
          <div className="text-xs text-muted-foreground mt-1">
            ID: {race.id}
          </div>
          {race.race_id && (
            <div className="text-xs text-muted-foreground">
              API ID: {race.race_id}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{formatTime(race.off_time)}</TableCell>
      <TableCell>{race.field_size}</TableCell>
      <TableCell>
        <RaceDocumentsCell
          documents={race.race_documents || []}
          onDeleteDocument={onDeleteDocument}
        />
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  );
};