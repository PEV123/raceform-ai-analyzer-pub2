import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { RawDataDialog } from "./RawDataDialog";
import { RaceDataDialog } from "./RaceDataDialog";
import { formatInTimeZone } from 'date-fns-tz';
import { useImportHorseResultsMutation } from "./mutations/useImportHorseResultsMutation";
import { useImportHorseDistanceAnalysisMutation } from "./mutations/useImportHorseDistanceAnalysisMutation";
import { useToast } from "@/hooks/use-toast";
import { useRaceData } from "./useRaceData";
import { useRaceDocuments } from "./hooks/useRaceDocuments";
import { RaceTable } from "./race-list/RaceTable";

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
  const [dbDataRace, setDbDataRace] = useState<Race | null>(null);
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
      <RaceTable
        races={dedupedRaces}
        formatTime={formatTime}
        onUploadDocs={setSelectedRace}
        onViewRawData={setRawDataRace}
        onViewDbData={setDbDataRace}
        onImportHorseResults={handleImportHorseResults}
        onImportDistanceAnalysis={handleImportDistanceAnalysis}
        hasImportedResults={hasImportedResults}
        hasImportedAnalysis={hasImportedAnalysis}
        isImportingResults={importHorseResults.isPending}
        isImportingAnalysis={importDistanceAnalysis.isPending}
        onDeleteDocument={handleDeleteDocument}
      />

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

      <RaceDataDialog
        race={dbDataRace}
        open={!!dbDataRace}
        onOpenChange={(open) => !open && setDbDataRace(null)}
      />
    </>
  );
};