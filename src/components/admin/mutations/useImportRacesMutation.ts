import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { processRace, processRunners } from "@/services/race";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

interface ImportRacesParams {
  date: Date;
  onProgress?: (progress: number, operation: string) => void;
  onUpdateSummary?: (summary: any) => void;
}

export const useImportRacesMutation = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, onProgress, onUpdateSummary }: ImportRacesParams) => {
      console.log('Importing races for date:', date);
      
      // Format the date in UK timezone for the API request
      const ukDate = formatInTimeZone(date, 'Europe/London', 'yyyy-MM-dd');
      console.log('Formatted UK date for API request:', ukDate);

      // Call the Edge Function to fetch races
      const { data: response, error: fetchError } = await supabase.functions.invoke('fetch-races-by-date', {
        body: { date: ukDate }
      });

      if (fetchError) {
        console.error("Error fetching races from Edge Function:", fetchError);
        throw fetchError;
      }

      console.log('Edge Function response:', response);

      const races = response?.races || [];
      console.log(`Processing ${races.length} races from Edge Function`);

      let nonRunnerUpdates = [];
      let oddsUpdates = [];

      for (let i = 0; i < races.length; i++) {
        const race = races[i];
        const progress = Math.round((i / races.length) * 100);
        
        onProgress?.(progress, `Processing race at ${race.course}`);
        console.log(`Processing race ${i + 1}/${races.length} at ${race.course}`);

        try {
          const processedRace = await processRace(race);
          
          if (race.runners?.length > 0) {
            const { nonRunnerUpdates: raceNonRunners, oddsUpdates: raceOddsUpdates } = 
              await processRunners(processedRace.id, race.runners);
            
            if (raceNonRunners > 0) {
              nonRunnerUpdates.push({
                raceId: race.race_id,
                course: race.course,
                count: raceNonRunners
              });
            }
            
            if (raceOddsUpdates > 0) {
              oddsUpdates.push({
                raceId: race.race_id,
                course: race.course,
                count: raceOddsUpdates
              });
            }
          }
        } catch (error) {
          console.error(`Error processing race at ${race.course}:`, error);
          throw error;
        }
      }

      onProgress?.(100, "Import complete");
      
      if (onUpdateSummary) {
        onUpdateSummary({
          nonRunnerUpdates,
          oddsUpdates
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Races imported successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Error importing races:", error);
      toast({
        title: "Error",
        description: "Failed to import races. Please try again.",
        variant: "destructive",
      });
    },
  });
};