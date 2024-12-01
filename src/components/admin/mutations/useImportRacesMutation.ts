import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";
import { processRace, processRunners } from "@/services/raceProcessing";

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

      const totalOperations = races.length * (2 + (races.reduce((sum, race) => sum + (race.runners?.length || 0), 0)));
      let completedOperations = 0;

      for (const race of races) {
        try {
          // Step 2: Process race data
          onProgress(
            (completedOperations / totalOperations) * 100,
            `Processing race at ${race.course} (${race.off_time})`
          );
          
          const raceData = await processRace(race);
          completedOperations++;
          
          if (raceData) {
            // Step 3: Process runners
            await processRunners(raceData.id, race.runners);
            completedOperations++;

            // Step 4: For each runner, import results and analysis
            if (race.runners) {
              for (const runner of race.runners) {
                if (!runner.horse_id) continue;

                // Import horse results
                onProgress(
                  (completedOperations / totalOperations) * 100,
                  `Importing results for ${runner.horse} (${runner.horse_id}) at ${race.course}`
                );

                const { error: resultsError } = await supabase.functions.invoke('fetch-horse-results', {
                  body: { horseId: runner.horse_id }
                });

                if (resultsError) {
                  console.error(`Error fetching results for horse ${runner.horse_id}:`, resultsError);
                }
                completedOperations++;

                // Import distance analysis
                onProgress(
                  (completedOperations / totalOperations) * 100,
                  `Importing distance analysis for ${runner.horse} (${runner.horse_id}) at ${race.course}`
                );

                const { error: analysisError } = await supabase.functions.invoke('fetch-horse-results', {
                  body: { 
                    horseId: runner.horse_id,
                    type: 'distance-analysis'
                  }
                });

                if (analysisError) {
                  console.error(`Error fetching analysis for horse ${runner.horse_id}:`, analysisError);
                }
                completedOperations++;
              }
            }
          }
        } catch (error) {
          console.error('Error processing race:', error);
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