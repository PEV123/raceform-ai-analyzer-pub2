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
import { X } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  
  const importHorseResults = useImportHorseResultsMutation();
  const importDistanceAnalysis = useImportHorseDistanceAnalysisMutation();
  const { hasImportedResults, hasImportedAnalysis } = useRaceData(races);

  const handleDeleteDocument = async (raceId: string, doc: Tables<"race_documents">) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('race_documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('race_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      // Refresh the races data
      queryClient.invalidateQueries({ queryKey: ["races"] });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

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
              <TableCell>
                {formatTime(race.off_time)}
              </TableCell>
              <TableCell>{race.field_size}</TableCell>
              <TableCell>0</TableCell>
              <TableCell>
                {race.race_documents?.length > 0 ? (
                  <div className="flex gap-2">
                    {race.race_documents.map((doc) => (
                      <div key={doc.id} className="relative group">
                        <HoverCard>
                          <HoverCardTrigger>
                            <img
                              src={`https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`}
                              alt={doc.file_name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto p-0">
                            <img
                              src={`https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`}
                              alt={doc.file_name}
                              className="max-w-[300px] max-h-[300px] object-contain rounded"
                            />
                          </HoverCardContent>
                        </HoverCard>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteDocument(race.id, doc)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  "No documents"
                )}
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