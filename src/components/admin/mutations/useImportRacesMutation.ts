import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";
import { processRace, processRunners } from "@/services/raceProcessing";
import { importHorseResults, importDistanceAnalysis } from "./utils/importRacesUtils";

interface ImportProgress {
  onProgress: (progress: number, operation: string) => void;
}

interface ImportParams extends ImportProgress {
  date: Date;
}

export const useImportRacesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, onProgress }: ImportParams) => {
      console.log('Starting full import process for date:', date);
      
      // Step 1: Fetch and import races
      onProgress(0, "Fetching races from API...");
      const races = await fetchRacesForDate(date);
      console.log('Fetched races:', races);

      const totalOperations = races.length * 3; // One for each main operation per race
      let completedOperations = 0;

      for (const race of races) {
        try {
          // Process race data
          onProgress(
            (completedOperations / totalOperations) * 100,
            `Processing race at ${race.course} (${race.off_time})`
          );
          
          const raceData = await processRace(race);
          if (!raceData) {
            console.log(`Race ${race.race_id} already exists, skipping`);
            continue;
          }
          
          // Process runners
          if (race.runners && Array.isArray(race.runners)) {
            await processRunners(raceData.id, race.runners);
            
            // Step 2: Import horse results for each runner
            onProgress(
              ((completedOperations + 1) / totalOperations) * 100,
              `Importing results for horses at ${race.course}`
            );
            
            for (const runner of race.runners) {
              if (!runner.horse_id) continue;
              await importHorseResults(runner.horse_id);
            }
            
            // Step 3: Import distance analysis for each runner
            onProgress(
              ((completedOperations + 2) / totalOperations) * 100,
              `Importing distance analysis for horses at ${race.course}`
            );
            
            for (const runner of race.runners) {
              if (!runner.horse_id) continue;
              await importDistanceAnalysis(runner.horse_id);
            }
          }
          
          completedOperations += 3;
        } catch (error) {
          console.error(`Error processing race ${race.race_id}:`, error);
          throw error;
        }
      }

      onProgress(100, "Import completed successfully!");
      return races;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      toast({
        title: "Success",
        description: "All race data imported successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in mutation:', error);
      toast({
        title: "Error",
        description: "Failed to import races: " + error.message,
        variant: "destructive",
      });
    },
  });
};