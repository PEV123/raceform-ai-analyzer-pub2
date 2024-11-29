import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { RawDataDialog } from "./RawDataDialog";
import { FileJson, History, ExternalLink, Eye, BarChart2, CheckCircle } from "lucide-react";
import { formatInTimeZone } from 'date-fns-tz';
import { useImportHorseResultsMutation } from "./mutations/useImportHorseResultsMutation";
import { useImportHorseDistanceAnalysisMutation } from "./mutations/useImportHorseDistanceAnalysisMutation";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  
  const importHorseResults = useImportHorseResultsMutation();
  const importDistanceAnalysis = useImportHorseDistanceAnalysisMutation();

  // Query to check for existing horse results
  const { data: existingResults } = useQuery({
    queryKey: ["existingHorseResults"],
    queryFn: async () => {
      const horseIds = races.flatMap(race => race.runners?.map(runner => runner.horse_id) || []);
      if (horseIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('horse_results')
        .select('horse_id')
        .in('horse_id', horseIds);

      if (error) throw error;
      return data;
    },
  });

  // Query to check for existing distance analysis
  const { data: existingAnalysis } = useQuery({
    queryKey: ["existingDistanceAnalysis"],
    queryFn: async () => {
      const horseIds = races.flatMap(race => race.runners?.map(runner => runner.horse_id) || []);
      if (horseIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('horse_distance_analysis')
        .select('horse_id')
        .in('horse_id', horseIds);

      if (error) throw error;
      return data;
    },
  });

  const hasImportedResults = (race: Race) => {
    if (!race.runners || !existingResults) return false;
    return race.runners.every(runner => 
      existingResults.some(result => result.horse_id === runner.horse_id)
    );
  };

  const hasImportedAnalysis = (race: Race) => {
    if (!race.runners || !existingAnalysis) return false;
    return race.runners.every(runner => 
      existingAnalysis.some(analysis => analysis.horse_id === runner.horse_id)
    );
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

  const handleViewRace = (race: Race) => {
    navigate(`/analysis/${race.id}`);
  };

  const handleViewRaceCard = (race: Race) => {
    navigate(`/race?raceId=${race.id}`);
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
                      <img
                        key={doc.id}
                        src={`https://vlcrqrmqghskrdhhsgqt.supabase.co/storage/v1/object/public/race_documents/${doc.file_path}`}
                        alt={doc.file_name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ))}
                  </div>
                ) : (
                  "No documents"
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRace(race)}
                  >
                    Upload Docs
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRawDataRace(race)}
                    title="View Raw Data"
                  >
                    <FileJson className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleImportHorseResults(race)}
                      disabled={importHorseResults.isPending}
                      title="Import Horse Results"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {hasImportedResults(race) && (
                      <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleImportDistanceAnalysis(race)}
                      disabled={importDistanceAnalysis.isPending}
                      title="Import Distance Analysis"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    {hasImportedAnalysis(race) && (
                      <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleViewRace(race)}
                    title="View Race Analysis"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleViewRaceCard(race)}
                    title="View Race Card"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
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