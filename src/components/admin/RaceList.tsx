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
  const { 
    hasImportedResults, 
    hasImportedAnalysis,
    getImportedResultsCount,
    getImportedAnalysisCount 
  } = useRaceData(races);
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

    // Dedupe runners by horse_id before importing
    const uniqueRunners = Array.from(
      new Map(race.runners.map(runner => [runner.horse_id, runner])).values()
    );
    console.log(`Deduped runners for ${race.course}: ${uniqueRunners.length} unique runners from ${race.runners.length} total`);

    await importHorseResults.mutate(uniqueRunners);
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

    // Dedupe runners by horse_id before analyzing
    const uniqueRunners = Array.from(
      new Map(race.runners.map(runner => [runner.horse_id, runner])).values()
    );
    console.log(`Deduped runners for analysis at ${race.course}: ${uniqueRunners.length} unique runners from ${race.runners.length} total`);

    await importDistanceAnalysis.mutate(uniqueRunners);
  };

  // Create a Map to store unique races by their course and off_time combination
  const uniqueRaces = new Map<string, Race>();
  races.forEach(race => {
    const key = `${race.course}-${race.off_time}`;
    const existingRace = uniqueRaces.get(key);
    
    if (!existingRace || (race.race_documents?.length > 0 && (!existingRace.race_documents || existingRace.race_documents.length === 0))) {
      // Dedupe runners when adding a race
      const uniqueRunners = Array.from(
        new Map(race.runners?.map(runner => [runner.horse_id, runner]) || []).values()
      );
      uniqueRaces.set(key, {
        ...race,
        runners: uniqueRunners
      });
    }
  });

  // Convert the Map back to an array and sort by course name first, then by off_time
  const dedupedRaces = Array.from(uniqueRaces.values())
    .sort((a, b) => {
      // First sort by course name
      const courseComparison = a.course.localeCompare(b.course);
      // If courses are the same, sort by time
      if (courseComparison === 0) {
        return new Date(a.off_time).getTime() - new Date(b.off_time).getTime();
      }
      return courseComparison;
    });

  console.log('Sorted races by venue and time:', dedupedRaces.map(r => `${r.course} - ${r.off_time}`));

  return (
    <>
      <RaceTable
        races={dedupedRaces}
        formatTime={(date) => {
          const timeMatch = date.match(/T(\d{2}:\d{2})/);
          return timeMatch ? timeMatch[1] : '';
        }}
        onUploadDocs={setSelectedRace}
        onViewRawData={setRawDataRace}
        onViewDbData={setDbDataRace}
        onImportHorseResults={handleImportHorseResults}
        onImportDistanceAnalysis={handleImportDistanceAnalysis}
        hasImportedResults={hasImportedResults}
        hasImportedAnalysis={hasImportedAnalysis}
        getImportedResultsCount={getImportedResultsCount}
        getImportedAnalysisCount={getImportedAnalysisCount}
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