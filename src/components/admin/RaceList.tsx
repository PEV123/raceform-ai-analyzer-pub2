import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { RawDataDialog } from "./RawDataDialog";
import { formatInTimeZone } from 'date-fns-tz';
import { useImportHorseResultsMutation } from "./mutations/useImportHorseResultsMutation";
import { useImportHorseDistanceAnalysisMutation } from "./mutations/useImportHorseDistanceAnalysisMutation";
import { useToast } from "@/hooks/use-toast";
import { RaceActionButtons } from "./RaceActionButtons";
import { useRaceData } from "./useRaceData";
import { RaceDocumentsCell } from "./RaceDocumentsCell";
import { useRaceDocuments } from "./hooks/useRaceDocuments";

type Race = Tables<"races"> & {
  race_documents: Tables<"race_documents">[];
  runners: Tables<"runners">[];
};

interface RaceListProps {
  races: Race[];
}

export const RaceList = ({ races }: RaceListProps) => {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [rawDataRace, setRawDataRace] = useState<Race | null>(null);
  const { toast } = useToast();
  
  const importHorseResults = useImportHorseResultsMutation();
  const importDistanceAnalysis = useImportHorseDistanceAnalysisMutation();
  const { hasImportedResults, hasImportedAnalysis } = useRaceData(races);
  const { handleDeleteDocument } = useRaceDocuments();

  const handleImportHorseResults = async (race: Race) => {
    if (!race.runners?.length) {
      toast({
        title: "No runners found",
        description: "This race has no runners to import results for.",
        variant: "destructive",
      });
      return;
    }

    await importHorseResults.mutate(race.runners);
  };

  const handleImportDistanceAnalysis = async (race: Race) => {
    if (!race.runners?.length) {
      toast({
        title: "No runners found",
        description: "This race has no runners to analyze.",
        variant: "destructive",
      });
      return;
    }

    await importDistanceAnalysis.mutate(race.runners);
  };

  const formatTime = (date: string) => {
    return formatInTimeZone(new Date(date), 'Europe/London', 'HH:mm');
  };

  // Create a Map to store unique races by their course and off_time combination
  const uniqueRaces = new Map<string, Race>();
  races.forEach(race => {
    const key = `${race.course}-${race.off_time}`;
    const existingRace = uniqueRaces.get(key);
    
    if (!existingRace || (race.race_documents?.length > 0 && (!existingRace.race_documents || existingRace.race_documents.length === 0))) {
      uniqueRaces.set(key, race);
    }
  });

  // Convert the Map back to an array and sort by off_time
  const dedupedRaces = Array.from(uniqueRaces.values())
    .sort((a, b) => new Date(a.off_time).getTime() - new Date(b.off_time).getTime());

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venue</TableHead>
            <TableHead>Race</TableHead>
            <TableHead>Number Runners</TableHead>
            <TableHead>Non Runners</TableHead>
            <TableHead>Docs</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dedupedRaces.map((race) => (
            <TableRow key={race.id}>
              <TableCell>{race.course}</TableCell>
              <TableCell>{formatTime(race.off_time)}</TableCell>
              <TableCell>{race.field_size}</TableCell>
              <TableCell>0</TableCell>
              <TableCell>
                <RaceDocumentsCell
                  documents={race.race_documents || []}
                  onDeleteDocument={handleDeleteDocument}
                />
              </TableCell>
              <TableCell>
                <RaceActionButtons
                  race={race}
                  onUploadDocs={() => setSelectedRace(race)}
                  onViewRawData={() => setRawDataRace(race)}
                  onImportHorseResults={() => handleImportHorseResults(race)}
                  onImportDistanceAnalysis={() => handleImportDistanceAnalysis(race)}
                  hasImportedResults={hasImportedResults(race)}
                  hasImportedAnalysis={hasImportedAnalysis(race)}
                  isImportingResults={importHorseResults.isPending}
                  isImportingAnalysis={importDistanceAnalysis.isPending}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DocumentUploadDialog
        race={selectedRace}
        open={!!selectedRace}
        onOpenChange={(open) => !open && setSelectedRace(null)}
      />

      <RawDataDialog
        race={rawDataRace}
        open={!!rawDataRace}
        onOpenChange={(open) => !open && setRawDataRace(null)}
      />
    </>
  );
};