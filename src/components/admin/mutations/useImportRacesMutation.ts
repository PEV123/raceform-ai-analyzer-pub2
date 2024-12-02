import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchRacesForDate } from "@/services/racingApi";
import { processRace, processRunners } from "@/services/raceProcessing";
import { importHorseResults, importDistanceAnalysis } from "./utils/importRacesUtils";
import { sleep } from "@/lib/utils";

interface ImportProgress {
  onProgress: (progress: number, operation: string) => void;
  onUpdateSummary?: (summary: any) => void;
}

interface ImportParams extends ImportProgress {
  date: Date;
}

export const useImportRacesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, onProgress, onUpdateSummary }: ImportParams) => {
      console.log('Starting full import process for date:', date);
      
      const updateSummary = {
        nonRunnerUpdates: [] as any[],
        oddsUpdates: [] as any[]
      };
      
      // Step 1: Fetch and import races
      onProgress(0, "Fetching races from API...");
      const races = await fetchRacesForDate(date);
      console.log('Fetched races:', races);

      const totalOperations = races.length * 3; // One for each main operation per race
      let completedOperations = 0;

      for (const race of races) {
        try {
          // Check if race exists and get its ID
          const { data: existingRace } = await supabase
            .from("races")
            .select("id")
            .eq("race_id", race.race_id)
            .single();

          let raceData;
          if (existingRace) {
            console.log(`Updating existing race ${race.race_id}`);
            raceData = existingRace;
          } else {
            console.log(`Creating new race ${race.race_id}`);
            raceData = await processRace(race);
          }

          if (!raceData) {
            console.error(`Failed to process race ${race.race_id}`);
            continue;
          }
          
          // Process runners with delay between batches
          if (race.runners && Array.isArray(race.runners)) {
            const nonRunnerUpdates = await processRunners(raceData.id, race.runners);
            
            if (nonRunnerUpdates > 0) {
              updateSummary.nonRunnerUpdates.push({
                raceId: race.race_id,
                course: race.course,
                count: nonRunnerUpdates
              });
            }

            // Step 2: Import horse results for each runner with delays
            for (const runner of race.runners) {
              if (!runner.horse_id) continue;
              
              onProgress(
                ((completedOperations + 1) / totalOperations) * 100,
                `Importing results for ${race.course} (${race.off_time}) - ${runner.horse} (${runner.horse_id})`
              );
              
              try {
                await importHorseResults(runner.horse_id);
                await sleep(500);
              } catch (error) {
                console.error(`Error importing results for horse ${runner.horse_id}:`, error);
                continue;
              }
            }
            
            // Step 3: Import distance analysis for each runner with delays
            for (const runner of race.runners) {
              if (!runner.horse_id) continue;
              
              onProgress(
                ((completedOperations + 2) / totalOperations) * 100,
                `Importing distance analysis for ${race.course} (${race.off_time}) - ${runner.horse} (${runner.horse_id})`
              );
              
              try {
                await importDistanceAnalysis(runner.horse_id);
                await sleep(500);
              } catch (error) {
                console.error(`Error importing distance analysis for horse ${runner.horse_id}:`, error);
                continue;
              }
            }
          }
          
          completedOperations += 3;
          await sleep(1000);
        } catch (error) {
          console.error(`Error processing race ${race.race_id}:`, error);
          continue;
        }
      }

      if (onUpdateSummary) {
        onUpdateSummary(updateSummary);
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